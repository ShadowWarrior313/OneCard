import "server-only";

import type { AccountBase, Transaction } from "plaid";
import { ProviderError, ProviderNotConfiguredError } from "../provider";
import type { ProviderAccount, ProviderTransaction } from "../types";
import { PlaidConfigurationError } from "./client";

/** Plaid account → neutral account (safe metadata only; never a PAN). */
export function toProviderAccount(account: AccountBase): ProviderAccount {
  return {
    providerAccountId: account.account_id,
    name: account.name,
    officialName: account.official_name ?? undefined,
    mask: account.mask ?? undefined,
    type: String(account.type),
    subtype: account.subtype ? String(account.subtype) : undefined,
  };
}

/**
 * Plaid transaction → neutral transaction.
 *
 * We carry Plaid's `personal_finance_category.primary` only as a HINT in
 * `providerCategoryHint`; the reward category is decided later by the MCC engine.
 */
export function toProviderTransaction(transaction: Transaction): ProviderTransaction {
  return {
    providerTransactionId: transaction.transaction_id,
    providerAccountId: transaction.account_id,
    merchantName: transaction.merchant_name ?? transaction.name,
    amount: transaction.amount,
    isoCurrencyCode:
      transaction.iso_currency_code ?? transaction.unofficial_currency_code ?? undefined,
    date: transaction.authorized_date ?? transaction.date,
    pending: transaction.pending,
    paymentChannel: transaction.payment_channel,
    website: transaction.website ?? undefined,
    providerCategoryHint: transaction.personal_finance_category?.primary,
  };
}

/** Best-effort extraction of Plaid's `error_code` without trusting the shape. */
function plaidErrorCode(error: unknown): string | undefined {
  const data = (error as { response?: { data?: { error_code?: unknown } } })?.response?.data;
  return typeof data?.error_code === "string" ? data.error_code : undefined;
}

/**
 * Normalise any Plaid failure into a `ProviderError` the reliability layer
 * understands. This is where Plaid's idiosyncratic codes become uniform
 * retry/health signals.
 */
export function mapPlaidError(error: unknown): ProviderError {
  if (error instanceof PlaidConfigurationError) {
    return new ProviderNotConfiguredError(error.message);
  }
  if (error instanceof ProviderError) return error;

  const code = plaidErrorCode(error);
  switch (code) {
    case "ITEM_LOGIN_REQUIRED":
      return new ProviderError({
        message: "The bank requires re-authentication",
        code,
        retryable: false,
        status: "login_required",
      });
    case "INSTITUTION_RATE_LIMIT":
    case "RATE_LIMIT_EXCEEDED":
      return new ProviderError({
        message: "Provider rate limit; backing off",
        code,
        retryable: true,
        retryAfterMs: 1_000,
        status: "healthy",
      });
    case "PRODUCT_NOT_READY":
      return new ProviderError({
        message: "Data not ready yet; backing off",
        code,
        retryable: true,
        retryAfterMs: 1_500,
        status: "healthy",
      });
    default:
      return new ProviderError({
        message: "Provider request failed",
        code: code ?? "provider_error",
        retryable: false,
        status: "error",
      });
  }
}
