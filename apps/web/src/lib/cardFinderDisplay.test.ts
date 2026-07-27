import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FinderOffer } from "../types/cardFinder.ts";
import {
  formatAnnualFee,
  formatCashAdvanceRate,
  formatPurchaseRate,
  formatSecondCardFee,
} from "./cardFinderDisplay.ts";

function offer(partial: {
  title?: string;
  cardId?: string;
  details?: FinderOffer["details"];
}): FinderOffer {
  return {
    providerId: "cibc",
    providerName: "CIBC",
    title: partial.title ?? "CIBC Dividend Visa Infinite",
    url: "https://example.com/card",
    score: 1,
    reasons: [],
    source: "structured",
    cardId: partial.cardId ?? "cibc_dividend_infinite",
    details: partial.details ?? {},
  };
}

describe("cardFinderDisplay", () => {
  it("does not treat rewards cashback percents as purchase APR", () => {
    const result = formatPurchaseRate(
      offer({
        details: { rewardsRate: "1% base earn", annualFee: "$120 annual fee" },
      }),
    );
    assert.equal(result, "—");
  });

  it("does not fabricate a purchase APR when catalog cardId is known", () => {
    assert.equal(formatPurchaseRate(offer({ details: {} })), "—");
  });

  it("does not surface intro/promotional APR as the ongoing purchase rate", () => {
    assert.equal(
      formatPurchaseRate(
        offer({ details: { introApr: "0% intro APR for 12 months" } }),
      ),
      "—",
    );
  });

  it("shows an explicit non-intro APR from the APR field", () => {
    assert.equal(
      formatPurchaseRate(offer({ details: { introApr: "19.99% purchase APR" } })),
      "19.99%",
    );
  });

  it("does not fabricate cash advance APR or $0 fees when data is missing", () => {
    const card = offer({ details: {} });
    assert.equal(formatCashAdvanceRate(card), "—");
    assert.equal(formatAnnualFee(card.details, card.cardId), "—");
    assert.equal(formatSecondCardFee(card.details, card.cardId), "—");
  });

  it("still formats real fee strings from issuer details", () => {
    assert.equal(formatAnnualFee({ annualFee: "$120 annual fee" }, "x"), "$120");
    assert.equal(formatAnnualFee({ annualFee: "No annual fee" }, "x"), "$0");
    assert.equal(
      formatSecondCardFee({ additionalUserFee: "$0 additional card fee" }, "x"),
      "$0",
    );
  });

  it("surfaces an explicit cash-advance APR mention only", () => {
    assert.equal(
      formatCashAdvanceRate(
        offer({ title: "Example Card — cash advance 22.99% APR" }),
      ),
      "22.99%",
    );
  });
});
