import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyBillPayment, type CardBill } from "./cardBills.ts";

function openBill(overrides: Partial<CardBill> = {}): CardBill {
  return {
    id: "bill_test",
    cardId: "amex_cobalt",
    cardName: "Amex Cobalt",
    issuer: "American Express",
    statementBalance: 4000,
    minimumDue: 80,
    dueDate: "2099-06-15",
    status: "upcoming",
    autopay: false,
    ...overrides,
  };
}

describe("applyBillPayment", () => {
  it("keeps the bill open after a minimum payment and reduces the balance", () => {
    const next = applyBillPayment(openBill(), 80, "2026-08-02T12:00:00.000Z");
    assert.equal(next.status, "upcoming");
    assert.equal(next.statementBalance, 3920);
    assert.equal(next.minimumDue, 80);
    assert.equal(next.lastPaymentAmount, 80);
  });

  it("marks the bill paid only when the payment covers the statement balance", () => {
    const next = applyBillPayment(openBill(), 4000, "2026-08-02T12:00:00.000Z");
    assert.equal(next.status, "paid");
    assert.equal(next.statementBalance, 0);
    assert.equal(next.minimumDue, 0);
    assert.equal(next.lastPaymentAmount, 4000);
  });

  it("does not revive an already-paid bill", () => {
    const paid = openBill({ status: "paid", statementBalance: 0, minimumDue: 0 });
    const next = applyBillPayment(paid, 50, "2026-08-02T12:00:00.000Z");
    assert.equal(next.status, "paid");
    assert.equal(next.statementBalance, 0);
  });
});
