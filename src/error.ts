export class InjectionDetectedError extends Error {
  category: string;
  confidence: number;
  explanation: string;
  originalInput: string;

  constructor(params: {
    category: string;
    confidence: number;
    explanation: string;
    originalInput: string;
  }) {
    super(`Prompt injection detected [${params.category}] (confidence: ${params.confidence}): ${params.explanation}`);
    this.name = "InjectionDetectedError";
    this.category = params.category;
    this.confidence = params.confidence;
    this.explanation = params.explanation;
    this.originalInput = params.originalInput;
  }
}
