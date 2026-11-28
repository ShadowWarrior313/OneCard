import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RewardCategory, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";

function mustCard(id: string): CardProduct {
  const card = getCardById(id);
  assert.ok(card, `missing catalog card ${id}`);
  return card;
}

function route(
  merchantId: string,
  merchantName: string,
  mcc: string,
  category: RewardCategory,
  amount = 80,
): RoutingDecision {
  return routeTransaction({
    mode: "virtual_provisioning",
    transaction: {
      amount,
      merchantName,
      mcc,
      merchantId,
      category,
    },
    portfolio: {
      cards: [mustCard("cibc_dividend_platinum"), mustCard("rbc_avion_infinite")],
      usage: [],
      preferences: { preferCashback: false },
    },
  });
}

describe("CIBC Dividend Platinum local transit and rideshare", () => {
  it("pays 2% on Uber instead of the 1% base that loses to Avion", () => {
    const platinum = mustCard("cibc_dividend_platinum");
    assert.equal(getRewardRule(platinum, "other", "uber").multiplier, 2);
    const decision = route("uber", "Uber", "4121", "other");
    assert.equal(decision.selectedCardId, "cibc_dividend_platinum");
    assert.equal(decision.estimatedRewardValueCents, 160);
    const avion = decision.alternatives.find((alt) => alt.cardId === "rbc_avion_infinite");
    assert.equal(avion?.estimatedRewardValueCents, 112);
  });

  it("pays 2% on TTC, Presto, GO, Lyft, and the transit sector", () => {
    for (const merchantId of ["ttc", "presto", "go_transit", "lyft", "sector_transport"] as const) {
      const decision = route(merchantId, merchantId, "4111", "other");
      assert.equal(decision.selectedCardId, "cibc_dividend_platinum", merchantId);
      assert.equal(decision.multiplier, 2, merchantId);
    }
  });

  it("still pays 2% when the extension passes category transportation", () => {
    const decision = route("uber", "Uber", "4121", "transportation");
    assert.equal(decision.selectedCardId, "cibc_dividend_platinum");
    assert.equal(decision.multiplier, 2);
  });

  it("does not pay the transit bonus on intercity bus or parking", () => {
    for (const merchantId of ["greyhound", "megabus", "parkwhiz", "spothero"] as const) {
      const decision = route(merchantId, merchantId, "4131", "transportation");
      assert.equal(decision.selectedCardId, "rbc_avion_infinite", merchantId);
      const platinum = decision.alternatives.find(
        (alt) => alt.cardId === "cibc_dividend_platinum",
      );
      assert.equal(platinum?.multiplier, 1, merchantId);
    }
  });

  it("leaves grocery, gas, dining, and base shopping unchanged", () => {
    const shell = route("shell", "Shell", "5541", "gas");
    assert.equal(shell.selectedCardId, "cibc_dividend_platinum");
    assert.equal(shell.multiplier, 3);

    const tims = route("tim_hortons", "Tim Hortons", "5814", "dining");
    assert.equal(tims.selectedCardId, "cibc_dividend_platinum");
    assert.equal(tims.multiplier, 2);

    const amazon = route("amazon", "Amazon.ca", "5399", "other");
    assert.equal(amazon.selectedCardId, "rbc_avion_infinite");
  });
});
