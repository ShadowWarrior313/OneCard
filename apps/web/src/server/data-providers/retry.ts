import "server-only";

import { ProviderError } from "./provider";

/**
 * Backoff for transient provider failures.
 *
 * Plaid surfaces transient conditions the naive caller turns into user-visible
 * failures: INSTITUTION_RATE_LIMIT, RATE_LIMIT_EXCEEDED, and PRODUCT_NOT_READY
 * (data still warming up right after a link). Providers map these to a
 * `ProviderError` with `retryable: true` and an optional `retryAfterMs`; this
 * helper retries them with exponential backoff + jitter, and lets everything
 * else fail fast.
 */
export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 8_000;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;
      const retryable = error instanceof ProviderError && error.retryable;
      if (!retryable || attempt >= maxAttempts) throw error;

      // Honour a provider-supplied delay; otherwise exponential backoff + jitter.
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const hinted = error instanceof ProviderError ? error.retryAfterMs : undefined;
      const delay = (hinted ?? backoff) + Math.floor(Math.random() * 250);
      await sleep(delay);
    }
  }
}
