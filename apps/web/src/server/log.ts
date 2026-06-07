import "server-only";

/**
 * Log scrubbing for the bank-data layer.
 *
 * Trust requirement: we must never leak account identifiers or, worse, an access
 * token into logs. These helpers redact anything that looks like a provider
 * token or an account/item identifier before it can be written, and provide a
 * single safe channel for server-side warnings in this layer.
 *
 * We deliberately log error *codes*, never error *bodies* (provider SDK errors
 * can echo back tokens and ids).
 */

/** Patterns that must never appear in logs. */
const TOKEN_PATTERNS: RegExp[] = [
  /access-(?:sandbox|development|production)-[a-z0-9-]+/gi, // Plaid access tokens
  /(?:public|link)-(?:sandbox|development|production)-[a-z0-9-]+/gi, // Plaid public/link tokens
  /\b[a-zA-Z0-9_-]{40,}\b/g, // long opaque tokens / ids
];

export function scrub(value: string): string {
  return TOKEN_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, "[redacted]"), value);
}

/**
 * Safe warning channel for the data layer. Accepts a short message and an
 * optional error *code* only — never an error object, token, or identifier.
 */
export function logProviderWarning(message: string, code?: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[bank-data] ${scrub(message)}${code ? ` (${scrub(code)})` : ""}`);
}
