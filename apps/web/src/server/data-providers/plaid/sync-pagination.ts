/**
 * Plaid transactions/sync pagination policy.
 *
 * A single HTTP handler must not pull an unbounded history into memory, so we
 * cap pages per call. When the cap is hit with `has_more` still true, callers
 * MUST return the accumulated results with `next_cursor` — never throw.
 *
 * Throwing leaves the durable cursor unchanged (`syncLinkedItem` only persists
 * the cursor on success), which permanently stalls large transaction histories.
 */

export const DEFAULT_MAX_SYNC_PAGES = 100;

export interface PlaidSyncPaginationFinish {
  /** Cursor to persist and pass on the next sync call. */
  nextCursor: string | undefined;
  /** True when more pages remain beyond this call's page budget. */
  hasMore: boolean;
  /** True when this call stopped because of the page budget (not natural end). */
  truncated: boolean;
}

export function finishPlaidSyncPagination(input: {
  hasMore: boolean;
  nextCursor: string | undefined;
  pageCount: number;
  maxPages?: number;
}): PlaidSyncPaginationFinish {
  const maxPages = input.maxPages ?? DEFAULT_MAX_SYNC_PAGES;
  const truncated = input.hasMore && input.pageCount >= maxPages;
  return {
    nextCursor: input.nextCursor,
    hasMore: input.hasMore,
    truncated,
  };
}
