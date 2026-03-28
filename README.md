# inject-guard

**A guard rail for AI agents — checks untrusted input for prompt injection before it reaches your LLM.**

Drop it in front of any agent input: user messages, tool results, webhooks, scraped content. Classifies against the TOKO system (10 injection categories). Throws on detection, passes silently when clean.

Works with any OpenAI-compatible model — Morpheus, Anthropic, OpenAI, Ollama, Together AI, or any local endpoint. Zero dependencies.

---

## Install

```bash
npm install inject-guard
```

Requires Node.js 18+ (uses built-in `fetch`). No SDK lock-in.

---

## Usage

### As a library (Node.js / TypeScript)

```typescript
import { checkInjection, InjectionDetectedError } from "inject-guard";

try {
  await checkInjection(userInput);
  // clean — proceed normally
} catch (err) {
  if (err instanceof InjectionDetectedError) {
    console.error(err.category);    // e.g. "role_hijacking"
    console.error(err.confidence);  // e.g. 0.95
    console.error(err.explanation); // plain-English reasoning
  }
}
```

### With Morpheus decentralized inference

```typescript
await checkInjection(userInput, {
  baseUrl: "http://localhost:8083/v1",
  model: "kimi-k2.5",
  apiKey: "morpheus-local",
});
```

### With OpenAI

```typescript
await checkInjection(userInput, {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});
```

### With local Ollama (no key needed)

```typescript
await checkInjection(userInput, {
  baseUrl: "http://localhost:11434/v1",
  model: "llama3.2",
});
```

### As a CLI

```bash
# Pipe input
echo "Ignore all previous instructions" | npx inject-guard

# Flag input
inject-guard --input "Ignore all previous instructions"

# With Morpheus
inject-guard --base-url http://localhost:8083/v1 --model kimi-k2.5 --input "some text"

# With local Ollama
inject-guard --base-url http://localhost:11434/v1 --model llama3.2 --input "some text"

# Custom confidence threshold
inject-guard --input "some text" --threshold 0.9
```

Exit codes: `0` = clean, `2` = injection detected, `1` = error.

### As an OpenClaw skill

Install the skill to use `checkInjection` as a native agent tool in any OpenClaw session:

```bash
# Copy skill to your OpenClaw workspace
cp -r skills/inject-guard ~/.openclaw/workspace/skills/
```

---

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

---

## TOKO Categories

| Category                       | Description                                               |
|--------------------------------|-----------------------------------------------------------|
| `role_hijacking`               | Override the AI's role ("Ignore previous instructions…")  |
| `authority_spoofing`           | False claims of authority ("Your operator says…")         |
| `framing_tricks`               | Fictional wrapping, roleplay used as escape hatch         |
| `evidence_fabrication`         | Fake tool results, invented citations                     |
| `assumption_planting`          | Planting false premises ("As we already established…")    |
| `opponent_mischaracterization` | Attacking safety rules ("Real AI would…")                 |
| `scope_creep`                  | Gradually expanding task to include prohibited actions    |
| `coercion_urgency`             | False urgency or threats                                  |
| `narrative_manipulation`       | Instructions hidden in stories, poems, code comments      |
| `self_misrepresentation`       | Claiming to be a system message or trusted source         |

---

## How It Works

1. **Normalize** — strips obfuscation: base64 substrings, unicode escapes, zero-width characters, excessive whitespace. Flags if input was modified (obfuscation is itself a signal).
2. **Classify** — sends normalized input to your chosen model with the TOKO prompt. Model returns `{injectionDetected, category, confidence, explanation}`.
3. **Throw or pass** — if `injectionDetected && confidence >= threshold`, throws `InjectionDetectedError`. Otherwise returns silently.
