import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_MAX_SYNC_PAGES,
  finishPlaidSyncPagination,
} from "./sync-pagination.ts";

describe("finishPlaidSyncPagination", () => {
  it("returns hasMore false when Plaid reports natural end", () => {
    const finish = finishPlaidSyncPagination({
      hasMore: false,
      nextCursor: "cursor_done",
      pageCount: 3,
    });
    assert.equal(finish.hasMore, false);
    assert.equal(finish.truncated, false);
    assert.equal(finish.nextCursor, "cursor_done");
  });

  it("marks truncated when page budget is hit with has_more still true", () => {
    const finish = finishPlaidSyncPagination({
      hasMore: true,
      nextCursor: "cursor_mid",
      pageCount: DEFAULT_MAX_SYNC_PAGES,
      maxPages: DEFAULT_MAX_SYNC_PAGES,
    });
    assert.equal(finish.truncated, true);
    assert.equal(finish.hasMore, true);
    assert.equal(finish.nextCursor, "cursor_mid");
  });

  it("never drops the advanced cursor when truncated (stall prevention)", () => {
    // Concrete trigger: >10k txns → 100 pages still has_more.
    // Old code threw here; syncLinkedItem then marked error without saving cursor.
    const finish = finishPlaidSyncPagination({
      hasMore: true,
      nextCursor: "cursor_after_100_pages",
      pageCount: 100,
      maxPages: 100,
    });
    assert.ok(finish.nextCursor, "cursor must be returned so the next sync can continue");
    assert.equal(finish.hasMore, true);
    assert.equal(finish.truncated, true);
  });

  it("does not mark truncated before the page budget", () => {
    const finish = finishPlaidSyncPagination({
      hasMore: true,
      nextCursor: "cursor_early",
      pageCount: 1,
      maxPages: 100,
    });
    assert.equal(finish.truncated, false);
    assert.equal(finish.hasMore, true);
  });
});
