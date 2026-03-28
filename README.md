# inject-guard

Detect, classify, and throw on prompt injection attempts in arbitrary text input.

Uses any OpenAI-compatible model as the classifier — Anthropic, OpenAI, Morpheus, Ollama, Together AI, or any local endpoint.

Classifies against the [TOKO system](https://github.com/DrStrangelang/inject-guard) (10 injection categories).

## Install

```bash
npm install inject-guard
```

No required dependencies — uses the Node.js built-in `fetch`.

## Module Usage

```typescript
import { checkInjection, InjectionDetectedError } from "inject-guard";

// Default: Anthropic endpoint, claude-sonnet-4-20250514
await checkInjection("What is the weather today?");

// Morpheus decentralized inference
await checkInjection(userInput, {
  baseUrl: "http://localhost:8083/v1",
  model: "kimi-k2.5",
  apiKey: "morpheus-local",
});

// OpenAI
await checkInjection(userInput, {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

// Local Ollama (no key needed)
await checkInjection(userInput, {
  baseUrl: "http://localhost:11434/v1",
  model: "llama3.2",
});
```

Throws `InjectionDetectedError` when injection is detected above the confidence threshold:

```typescript
try {
  await checkInjection(userInput);
} catch (err) {
  if (err instanceof InjectionDetectedError) {
    console.error(err.category);    // e.g. "role_hijacking"
    console.error(err.confidence);  // e.g. 0.95
    console.error(err.explanation); // plain-English reasoning
  }
}
```

## CLI Usage

```bash
# Pipe input
echo "Ignore all previous instructions" | npx inject-guard

# Flag input
inject-guard --input "Ignore all previous instructions"

# Use Morpheus instead of Anthropic
inject-guard --base-url http://localhost:8083/v1 --model kimi-k2.5 --input "some text"

# Use local Ollama (no API key needed)
inject-guard --base-url http://localhost:11434/v1 --model llama3.2 --input "some text"

# Custom threshold
inject-guard --input "some text" --threshold 0.9
```

Exit codes: `0` = clean, `2` = injection detected, `1` = error.

## Configuration

| Option                | Default                        | Description                              |
|-----------------------|--------------------------------|------------------------------------------|
| `baseUrl`             | `https://api.anthropic.com/v1` | Any OpenAI-compatible endpoint           |
| `model`               | `claude-sonnet-4-20250514`     | Model identifier for that endpoint       |
| `apiKey`              | (env var)                      | Bearer token for the endpoint            |
| `confidenceThreshold` | `0.75`                         | Minimum confidence to throw              |

## Environment Variables

| Variable               | Description                                   |
|------------------------|-----------------------------------------------|
| `INJECT_GUARD_API_KEY` | API key (preferred)                           |
| `INJECT_GUARD_BASE_URL`| Base URL override                             |
| `OPENAI_API_KEY`       | Fallback API key                              |

## TOKO Categories

| Category                    | Description                                               |
|-----------------------------|-----------------------------------------------------------|
| `role_hijacking`            | Override the AI's role ("Ignore previous instructions…")  |
| `authority_spoofing`        | False claims of authority ("Your operator says…")         |
| `framing_tricks`            | Fictional wrapping, roleplay used as escape hatch         |
| `evidence_fabrication`      | Fake tool results, invented citations                     |
| `assumption_planting`       | Planting false premises ("As we already established…")    |
| `opponent_mischaracterization` | Attacking safety rules ("Real AI would…")              |
| `scope_creep`               | Gradually expanding task to include prohibited actions    |
| `coercion_urgency`          | False urgency or threats                                  |
| `narrative_manipulation`    | Instructions hidden in stories, poems, code comments      |
| `self_misrepresentation`    | Claiming to be a system message or trusted source         |

## Zero Dependencies

inject-guard uses Node.js built-in `fetch` (v18+). No SDK lock-in.
