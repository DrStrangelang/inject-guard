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

function parseArgs(argv: string[]): {
  input?: string;
  threshold?: number;
  model?: string;
  baseUrl?: string;
} {
  const result: { input?: string; threshold?: number; model?: string; baseUrl?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--input" && argv[i + 1]) {
      result.input = argv[++i];
    } else if (argv[i] === "--threshold" && argv[i + 1]) {
      result.threshold = parseFloat(argv[++i]);
    } else if (argv[i] === "--model" && argv[i + 1]) {
      result.model = argv[++i];
    } else if ((argv[i] === "--base-url" || argv[i] === "--baseUrl") && argv[i + 1]) {
      result.baseUrl = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`inject-guard — Prompt injection detection via any OpenAI-compatible model

Usage:
  echo "text" | inject-guard
  inject-guard --input "text to check"

Options:
  --input <text>        Text to check for injection
  --threshold <0-1>     Confidence threshold (default: 0.75)
  --model <model>       Model identifier (default: claude-sonnet-4-20250514)
  --base-url <url>      OpenAI-compatible endpoint base URL
                        Default: https://api.anthropic.com/v1
                        Morpheus: http://localhost:8083/v1
                        OpenAI:   https://api.openai.com/v1
                        Ollama:   http://localhost:11434/v1
  -h, --help            Show this help

Environment variables:
  INJECT_GUARD_API_KEY  API key (preferred)
  INJECT_GUARD_BASE_URL Base URL override
  OPENAI_API_KEY        Fallback API key

Exit codes: 0 = clean, 2 = injection detected, 1 = error`);
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

  const apiKey = process.env.INJECT_GUARD_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = args.baseUrl || process.env.INJECT_GUARD_BASE_URL;

  // Only require an API key if not talking to a local endpoint
  const isLocal = baseUrl?.includes("localhost") || baseUrl?.includes("127.0.0.1");
  if (!apiKey && !isLocal) {
    console.error("Error: Set INJECT_GUARD_API_KEY (or OPENAI_API_KEY) for remote endpoints.");
    process.exit(1);
  }

  try {
    await checkInjection(input, {
      confidenceThreshold: args.threshold,
      model: args.model,
      apiKey,
      baseUrl,
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
