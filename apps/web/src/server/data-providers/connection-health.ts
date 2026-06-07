import "server-only";

import type { ConnectionStatusCode, FreshnessState } from "./types";

/**
 * The freshness / staleness layer.
 *
 * Plaid data goes stale silently when a connection degrades. We define an
 * explicit freshness threshold: past it, data is marked `stale` and presented as
 * "last-known", never as live. This is the difference between a trustworthy
 * intelligence layer and one that quietly lies.
 *
 * Override with HUB_FRESHNESS_HOURS (defaults to 24h).
 */
export function freshnessThresholdMs(): number {
  const hours = Number(process.env.HUB_FRESHNESS_HOURS);
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24;
  return safeHours * 60 * 60 * 1000;
}

/** Classify how fresh a last-sync timestamp is. */
export function freshnessFor(lastSyncedAt: string | undefined, now = Date.now()): FreshnessState {
  if (!lastSyncedAt) return "never";
  const synced = Date.parse(lastSyncedAt);
  if (Number.isNaN(synced)) return "never";
  return now - synced > freshnessThresholdMs() ? "stale" : "fresh";
}

/**
 * Derive the user-facing connection status from the stored status + freshness.
 *
 * A `login_required` / `error` item keeps that status regardless of age — it is
 * the actionable signal. A `healthy` item degrades to `stale` once its last
 * sync crosses the freshness threshold, so the UI can warn instead of pretending.
 */
export function deriveStatus(input: {
  storedStatus: ConnectionStatusCode;
  lastSyncedAt?: string;
  now?: number;
}): ConnectionStatusCode {
  if (input.storedStatus === "login_required" || input.storedStatus === "error") {
    return input.storedStatus;
  }
  return freshnessFor(input.lastSyncedAt, input.now) === "stale" ? "stale" : "healthy";
}

/** Short, user-safe explanation for each status. Contains no identifiers. */
export function statusMessage(status: ConnectionStatusCode): string {
  switch (status) {
    case "login_required":
      return "Reconnect needed — your bank needs you to sign in again to resume syncing.";
    case "error":
      return "This connection hit an error. Showing last-synced data.";
    case "stale":
      return "Data may be outdated. Showing last-synced data while we refresh.";
    default:
      return "Connected and up to date.";
  }
}
