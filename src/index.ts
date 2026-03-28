import { normalize } from "./normalizer";
import { classify } from "./classifier";
import { InjectionDetectedError } from "./error";

export { InjectionDetectedError } from "./error";
export type { TokoCategory, ClassificationResult } from "./classifier";
export type { NormalizeResult } from "./normalizer";

export interface CheckInjectionOptions {
  confidenceThreshold?: number;
  model?: string;
  apiKey?: string;
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
