/**
 * Defense-in-depth guard for payment API routes.
 *
 * OneCard's servers must NEVER receive a raw card number (PAN), CVV/CVC, or
 * track data — card details go browser → Stripe directly. This guard inspects
 * an incoming request body and rejects it if it contains any field name that
 * implies raw card data. It is verified by scripts/security-check.ts.
 *
 * This does NOT replace the architecture (Stripe Elements / tokenization); it is
 * a belt-and-suspenders tripwire that makes a regression loud instead of silent.
 */

/** Normalised forbidden key names (lowercased, separators removed). */
const FORBIDDEN_KEYS = new Set([
  "number",
  "cardnumber",
  "fullcardnumber",
  "pan",
  "cvv",
  "cvc",
  "csc",
  "cardcvv",
  "cardcvc",
  "securitycode",
  "cardsecurity",
  "track1",
  "track2",
  "trackdata",
]);

export class RawCardDataError extends Error {
  readonly field: string;
  constructor(field: string) {
    super(`Forbidden raw card field "${field}" present in request body`);
    this.name = "RawCardDataError";
    this.field = field;
  }
}

/**
 * Recursively assert that `value` contains no forbidden raw-card field names.
 * Throws RawCardDataError on the first offending key. Never logs values.
 */
export function assertNoRawCardData(value: unknown, path = ""): void {
  if (value === null || typeof value !== "object") return;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      assertNoRawCardData(value[i], `${path}[${i}]`);
    }
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalised = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (FORBIDDEN_KEYS.has(normalised)) {
      throw new RawCardDataError(path ? `${path}.${key}` : key);
    }
    assertNoRawCardData(child, path ? `${path}.${key}` : key);
  }
}
