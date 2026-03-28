import { normalize } from "./normalizer";
import { classify } from "./classifier";
import { InjectionDetectedError } from "./error";

export { InjectionDetectedError } from "./error";
export type { TokoCategory, ClassificationResult } from "./classifier";
export type { NormalizeResult } from "./normalizer";

export interface CheckInjectionOptions {
  /** Minimum confidence score to throw. Default: 0.75 */
  confidenceThreshold?: number;
  /** OpenAI-compatible model identifier. Default: "claude-sonnet-4-20250514" */
  model?: string;
  /** API key passed as Bearer token. Falls back to INJECT_GUARD_API_KEY or OPENAI_API_KEY. */
  apiKey?: string;
  /** Base URL of any OpenAI-compatible endpoint.
   *  Default: https://api.anthropic.com/v1
   *  Examples:
   *    Morpheus proxy:  http://localhost:8083/v1
   *    OpenAI:          https://api.openai.com/v1
   *    Ollama:          http://localhost:11434/v1
   */
  baseUrl?: string;
}

export async function checkInjection(
  input: string,
  options: CheckInjectionOptions = {}
): Promise<void> {
  const threshold = options.confidenceThreshold ?? 0.75;

  const normalizeResult = normalize(input);
  const result = await classify(normalizeResult, {
    model: options.model,
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
  });

  if (result.injectionDetected && result.confidence >= threshold) {
    throw new InjectionDetectedError({
      category: result.category || "unknown",
      confidence: result.confidence,
      explanation: result.explanation,
      originalInput: input,
    });
  }
}
