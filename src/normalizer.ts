const BASE64_PATTERN = /(?:[A-Za-z0-9+/]{4}){2,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;
const UNICODE_ESCAPE_PATTERN = /\\u([0-9a-fA-F]{4})/g;
const ZERO_WIDTH_PATTERN = /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u180E]/g;
const EXCESSIVE_WHITESPACE_PATTERN = /\s{3,}/g;

function decodeBase64Substrings(input: string): string {
  return input.replace(BASE64_PATTERN, (match) => {
    try {
      const decoded = Buffer.from(match, "base64").toString("utf-8");
      if (/[\x00-\x08\x0E-\x1F\x7F]/.test(decoded)) {
        return match;
      }
      return decoded;
    } catch {
      return match;
    }
  });
}

function unescapeUnicode(input: string): string {
  return input.replace(UNICODE_ESCAPE_PATTERN, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function collapseWhitespace(input: string): string {
  return input
    .replace(ZERO_WIDTH_PATTERN, "")
    .replace(EXCESSIVE_WHITESPACE_PATTERN, " ");
}

export interface NormalizeResult {
  normalized: string;
  wasModified: boolean;
  raw: string;
}

export function normalize(input: string): NormalizeResult {
  let result = input;
  result = decodeBase64Substrings(result);
  result = unescapeUnicode(result);
  result = collapseWhitespace(result);

  return {
    normalized: result,
    wasModified: result !== input,
    raw: input,
  };
}
