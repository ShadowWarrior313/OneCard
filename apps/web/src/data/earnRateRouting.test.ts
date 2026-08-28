import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { routeTransaction } from "@onecard/rewards-engine";
import type { CardProduct, RewardCategory } from "@onecard/shared-types";
import { getCardById } from "./cards";

const DEFAULT_WALLET_IDS = [
  "amex_cobalt",
  "cibc_dividend_infinite",
  "scotia_momentum",
  "rbc_ion",
] as const;

function card(id: string): CardProduct {
  const found = getCardById(id);
  assert.ok(found, `missing catalog card ${id}`);
  return found;
}

function route(opts: {
  cardIds: readonly string[];
  amount: number;
  merchantName: string;
  merchantId: string;
  mcc: string;
  category: RewardCategory;
}) {
  const cards = opts.cardIds.map(card);
  return routeTransaction({
    mode: "virtual_provisioning",
    transaction: {
      amount: opts.amount,
      merchantName: opts.merchantName,
      merchantId: opts.merchantId,
      mcc: opts.mcc,
      category: opts.category,
    },
    portfolio: {
      cards,
      usage: [],
      preferences: { preferCashback: false },
      defaultCardId: cards[0]?.cardId,
    },
  });
}

describe("earn rates that inverted default-wallet recommendations", () => {
  it("does not give no-fee ION the ION+ 3× dining/grocery rates", () => {
    const ion = card("rbc_ion");
    const groceries = ion.rewards.find((r) => r.category === "groceries" && !r.merchantIds);
    const dining = ion.rewards.find((r) => r.category === "dining" && !r.merchantIds);
    assert.equal(groceries?.multiplier, 1.5);
    assert.ok(!dining || dining.multiplier === 1);
  });

  it("scores CIBC Dividend Infinite at 4% groceries, not 2%", () => {
    const cibc = card("cibc_dividend_infinite");
    const groceries = cibc.rewards.find(
      (r) => r.category === "groceries" && !r.merchantIds,
    );
    const dining = cibc.rewards.find((r) => r.category === "dining" && !r.merchantIds);
    assert.equal(groceries?.multiplier, 4);
    assert.equal(dining?.multiplier, 2);
  });

  it("picks CIBC Infinite over ION at featured Loblaws in the default wallet", () => {
    // Cobalt is not accepted at Loblaws. Wrong ION 3× (~4.2%) used to beat
    // CIBC's understated 2% grocery rate; issuer is 4% groceries vs ION 1.5× (~2.1%).
    const decision = route({
      cardIds: DEFAULT_WALLET_IDS,
      amount: 80,
      merchantName: "Loblaws",
      merchantId: "loblaws",
      mcc: "5411",
      category: "groceries",
    });
    assert.equal(decision.selectedCardId, "cibc_dividend_infinite");
    assert.notEqual(decision.selectedCardId, "rbc_ion");
  });

  it("picks CIBC Infinite over ION at featured Shell in the default wallet", () => {
    const decision = route({
      cardIds: DEFAULT_WALLET_IDS,
      amount: 80,
      merchantName: "Shell",
      merchantId: "shell",
      mcc: "5541",
      category: "gas",
    });
    assert.equal(decision.selectedCardId, "cibc_dividend_infinite");
    assert.notEqual(decision.selectedCardId, "rbc_ion");
  });

  it("still routes default-wallet dining to Cobalt", () => {
    const decision = route({
      cardIds: DEFAULT_WALLET_IDS,
      amount: 75,
      merchantName: "Uber Eats",
      merchantId: "uber_eats",
      mcc: "5812",
      category: "dining",
    });
    assert.equal(decision.selectedCardId, "amex_cobalt");
  });
});

describe("SimplyCash Preferred and ION+ catalog rates", () => {
  it("lets SimplyCash Preferred 4% beat CIBC Dividend Platinum 3% at Metro", () => {
    const decision = route({
      cardIds: ["amex_simplycash_preferred", "cibc_dividend_platinum"],
      amount: 80,
      merchantName: "Metro",
      merchantId: "metro",
      mcc: "5411",
      category: "groceries",
    });
    assert.equal(decision.selectedCardId, "amex_simplycash_preferred");
  });

  it("lets ION+ 3× dining beat CIBC Dividend Platinum 2%", () => {
    const decision = route({
      cardIds: ["rbc_ion_plus", "cibc_dividend_platinum"],
      amount: 80,
      merchantName: "Tim Hortons",
      merchantId: "tim_hortons",
      mcc: "5814",
      category: "dining",
    });
    assert.equal(decision.selectedCardId, "rbc_ion_plus");
  });

  it("lets TD Cash Back Infinite 3% streaming beat CIBC Infinite 1% at Netflix", () => {
    const decision = route({
      cardIds: ["td_cashback_infinite", "cibc_dividend_infinite"],
      amount: 16.99,
      merchantName: "Netflix",
      merchantId: "netflix",
      mcc: "5815",
      category: "streaming",
    });
    assert.equal(decision.selectedCardId, "td_cashback_infinite");
  });
});
