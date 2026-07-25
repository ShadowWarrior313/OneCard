import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  reconcileBillsWithWallet,
  type CardBill,
} from "./cardBills.ts";

function bill(cardId: string, status: CardBill["status"], autopay: boolean): CardBill {
  return {
    id: `bill_${cardId}`,
    cardId,
    cardName: cardId,
    issuer: "Test",
    statementBalance: 100,
    minimumDue: 25,
    dueDate: "2099-01-15",
    status,
    autopay,
    lastPaidAt: status === "paid" ? "2099-01-01" : undefined,
    lastPaymentAmount: status === "paid" ? 100 : undefined,
  };
}

describe("reconcileBillsWithWallet", () => {
  it("preserves paid/autopay state for cards still in the wallet", () => {
    const stored = [
      bill("amex_cobalt", "paid", true),
      bill("td_cash_back", "paid", false),
    ];
    const cards = [
      { cardId: "amex_cobalt", displayName: "Cobalt", issuer: "Amex" },
      { cardId: "td_cash_back", displayName: "TD", issuer: "TD" },
    ];

    const next = reconcileBillsWithWallet(stored, cards);
    assert.equal(next.length, 2);
    assert.equal(next.find((b) => b.cardId === "td_cash_back")?.status, "paid");
    assert.equal(next.find((b) => b.cardId === "amex_cobalt")?.autopay, true);
  });

  it("does not drop non-default wallet cards when reconciling against the real wallet", () => {
    const stored = [bill("custom_card", "paid", true)];
    const cards = [{ cardId: "custom_card", displayName: "Custom", issuer: "Bank" }];
    const next = reconcileBillsWithWallet(stored, cards);
    assert.equal(next.length, 1);
    assert.equal(next[0]?.cardId, "custom_card");
    assert.equal(next[0]?.status, "paid");
    assert.equal(next[0]?.autopay, true);
  });

  it("drops bills for cards removed from the wallet and seeds only new cards", () => {
    const stored = [bill("old_card", "paid", true)];
    const cards = [{ cardId: "new_card", displayName: "New", issuer: "Bank" }];
    const next = reconcileBillsWithWallet(stored, cards);
    assert.equal(next.length, 1);
    assert.equal(next[0]?.cardId, "new_card");
    assert.notEqual(next[0]?.id, "bill_old_card");
  });
});
