import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRewardRule, routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, CategoryUsage, RoutingDecision } from "@onecard/shared-types";
import { getCardById } from "./cards";
import { merchantById } from "./merchants";

function mustCard(id: string): CardProduct {
  const card = getCardById(id);
  assert.ok(card, `missing catalog card ${id}`);
  return card;
}

function route(
  merchantId: string,
  amount: number,
  cardIds: string[],
  usage: CategoryUsage[] = [],
): RoutingDecision {
  const merchant = merchantById(merchantId);
  assert.ok(merchant, `missing merchant ${merchantId}`);
  return routeTransaction({
    mode: "network_dependent",
    transaction: {
      amount,
      merchantName: merchant.name,
      mcc: merchant.mcc,
      merchantId: merchant.id,
      category: merchant.category,
    },
    portfolio: {
      cards: cardIds.map(mustCard),
      usage,
      preferences: { preferCashback: false },
      defaultCardId: cardIds[0],
    },
  });
}

describe("MBNA Rewards World Elite is 5x on issuer bonus MCCs, not a 1x stub", () => {
  it("beats Avion on featured Tim Hortons dining", () => {
    const decision = route("tim_hortons", 80, [
      "mbna_rewards_world_elite",
      "rbc_avion_infinite",
    ]);
    assert.equal(decision.selectedCardId, "mbna_rewards_world_elite");
    const mbna = decision.alternatives.find(
      (alt) => alt.cardId === "mbna_rewards_world_elite",
    );
    const avion = decision.alternatives.find(
      (alt) => alt.cardId === "rbc_avion_infinite",
    );
    assert.equal(mbna?.multiplier, 5);
    assert.equal(avion?.multiplier, 1.25);
    assert.ok(
      (mbna?.estimatedRewardValueCents ?? 0) >
        (avion?.estimatedRewardValueCents ?? 0) + 100,
    );
  });

  it("beats Avion on featured Metro groceries and keeps Walmart grocery eligible", () => {
    const metro = route("metro", 80, [
      "mbna_rewards_world_elite",
      "rbc_avion_infinite",
    ]);
    assert.equal(metro.selectedCardId, "mbna_rewards_world_elite");
    const metroMbna = metro.alternatives.find(
      (alt) => alt.cardId === "mbna_rewards_world_elite",
    );
    assert.equal(metroMbna?.multiplier, 5);

    const walmart = route("walmart_grocery", 80, [
      "mbna_rewards_world_elite",
      "rbc_avion_infinite",
    ]);
    assert.equal(walmart.selectedCardId, "mbna_rewards_world_elite");
    const walmartMbna = walmart.alternatives.find(
      (alt) => alt.cardId === "mbna_rewards_world_elite",
    );
    assert.equal(walmartMbna?.multiplier, 5);
  });

  it("does not pay grocery 5x at Costco warehouse", () => {
    const decision = route("costco", 80, [
      "mbna_rewards_world_elite",
      "cibc_costco",
    ]);
    assert.equal(decision.selectedCardId, "cibc_costco");
    const mbna = decision.alternatives.find(
      (alt) => alt.cardId === "mbna_rewards_world_elite",
    );
    assert.equal(mbna?.multiplier, 1);
  });

  it("beats Avion on Netflix streaming, Rogers bills, Steam, and GoodLife", () => {
    for (const merchantId of ["netflix", "rogers", "steam", "goodlife"] as const) {
      const decision = route(merchantId, 80, [
        "mbna_rewards_world_elite",
        "rbc_avion_infinite",
      ]);
      assert.equal(decision.selectedCardId, "mbna_rewards_world_elite", merchantId);
      const mbna = decision.alternatives.find(
        (alt) => alt.cardId === "mbna_rewards_world_elite",
      );
      assert.equal(mbna?.multiplier, 5, merchantId);
    }
  });

  it("stays at 1x on gas and Amazon, where Avion still wins", () => {
    const shell = route("shell", 80, [
      "mbna_rewards_world_elite",
      "rbc_avion_infinite",
    ]);
    assert.equal(shell.selectedCardId, "rbc_avion_infinite");
    const shellMbna = shell.alternatives.find(
      (alt) => alt.cardId === "mbna_rewards_world_elite",
    );
    assert.equal(shellMbna?.multiplier, 1);

    const amazon = route("amazon", 143, [
      "mbna_rewards_world_elite",
      "rbc_avion_infinite",
    ]);
    assert.equal(amazon.selectedCardId, "rbc_avion_infinite");
  });

  it("caps each bonus category at $50,000 without sharing the grocery cap into dining", () => {
    const capped = route(
      "metro",
      80,
      ["mbna_rewards_world_elite", "rbc_avion_infinite"],
      [
        {
          cardId: "mbna_rewards_world_elite",
          category: "groceries",
          spendThisPeriod: 50000,
        },
      ],
    );
    assert.equal(capped.selectedCardId, "rbc_avion_infinite");
    const cappedMbna = capped.alternatives.find(
      (alt) => alt.cardId === "mbna_rewards_world_elite",
    );
    assert.equal(cappedMbna?.multiplier, 1);

    const dining = route(
      "tim_hortons",
      80,
      ["mbna_rewards_world_elite", "rbc_avion_infinite"],
      [
        {
          cardId: "mbna_rewards_world_elite",
          category: "groceries",
          spendThisPeriod: 50000,
        },
      ],
    );
    assert.equal(dining.selectedCardId, "mbna_rewards_world_elite");
  });

  it("stores issuer fee, cash-redemption value, and category rules", () => {
    const card = mustCard("mbna_rewards_world_elite");
    assert.equal(card.displayName, "MBNA Rewards World Elite Mastercard");
    assert.equal(card.annualFee, 120);
    assert.equal(card.currency, "MBNA Rewards points");
    assert.equal(card.pointValueCents, 0.83);
    assert.equal(card.network, "mastercard");
    assert.equal(getRewardRule(card, "dining", "tim_hortons").multiplier, 5);
    assert.equal(getRewardRule(card, "groceries", "metro").multiplier, 5);
    assert.equal(getRewardRule(card, "groceries", "walmart_grocery").multiplier, 5);
    assert.equal(getRewardRule(card, "groceries", "costco").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "costco_wholesale").multiplier, 1);
    assert.equal(getRewardRule(card, "streaming", "netflix").multiplier, 5);
    assert.equal(getRewardRule(card, "recurring_bills", "rogers").multiplier, 5);
    assert.equal(getRewardRule(card, "recurring_bills", "enbridge").multiplier, 5);
    assert.equal(getRewardRule(card, "other", "steam").multiplier, 5);
    assert.equal(getRewardRule(card, "other", "goodlife").multiplier, 5);
    assert.equal(getRewardRule(card, "other", "peloton").multiplier, 5);
    assert.equal(getRewardRule(card, "gas", "shell").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "amazon").multiplier, 1);
    assert.equal(getRewardRule(card, "other", "cineplex").multiplier, 1);
    assert.equal(getRewardRule(card, "groceries", "metro").capAnnual, 50000);
    assert.equal(getRewardRule(card, "dining", "tim_hortons").capAnnual, 50000);
  });
});
