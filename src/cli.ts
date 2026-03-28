#!/usr/bin/env node

import { checkInjection, InjectionDetectedError } from "./index";

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);

    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

function parseArgs(argv: string[]): { input?: string; threshold?: number; model?: string } {
  const result: { input?: string; threshold?: number; model?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--input" && argv[i + 1]) {
      result.input = argv[++i];
    } else if (argv[i] === "--threshold" && argv[i + 1]) {
      result.threshold = parseFloat(argv[++i]);
    } else if (argv[i] === "--model" && argv[i + 1]) {
      result.model = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`inject-guard - Prompt injection detection using Claude

Usage:
  echo "text" | inject-guard
  inject-guard --input "text to check"

Options:
  --input <text>       Text to check for injection
  --threshold <0-1>    Confidence threshold (default: 0.75)
  --model <model>      Anthropic model to use (default: claude-sonnet-4-20250514)
  -h, --help           Show this help

Environment:
  ANTHROPIC_API_KEY    Required. Your Anthropic API key.`);
      process.exit(0);
    }
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv);
  const input = args.input || (await readStdin()).trim();

  if (!input) {
    console.error("Error: No input provided. Use --input or pipe text via stdin.");
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    process.exit(1);
  }

  try {
    await checkInjection(input, {
      confidenceThreshold: args.threshold,
      model: args.model,
    });
    console.log("PASS — No injection detected.");
    process.exit(0);
  } catch (err) {
    if (err instanceof InjectionDetectedError) {
      console.error("FAIL — Injection detected:");
      console.error(JSON.stringify({
        category: err.category,
        confidence: err.confidence,
        explanation: err.explanation,
      }, null, 2));
      process.exit(2);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
