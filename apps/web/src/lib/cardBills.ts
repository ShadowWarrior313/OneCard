export type BillStatus = "upcoming" | "due_soon" | "overdue" | "paid";

export type CardBill = {
  id: string;
  cardId: string;
  cardName: string;
  issuer: string;
  statementBalance: number;
  minimumDue: number;
  dueDate: string;
  status: BillStatus;
  autopay: boolean;
  lastPaidAt?: string;
  lastPaymentAmount?: number;
};

export type BillPayment = {
  id: string;
  billId: string;
  cardId: string;
  amount: number;
  paidAt: string;
  method: "onecard_balance" | "linked_bank";
};

const BILLS_STORAGE_KEY = "onecard_bills_v1";
const PAYMENTS_STORAGE_KEY = "onecard_bill_payments_v1";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusForDueDate(dueDate: string, paid: boolean): BillStatus {
  if (paid) return "paid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T12:00:00`);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 5) return "due_soon";
  return "upcoming";
}

export function seedBillsForCards(
  cards: { cardId: string; displayName: string; issuer: string }[],
): CardBill[] {
  const now = new Date();
  return cards.map((card, index) => {
    const seed = hashSeed(card.cardId);
    const statementBalance = 180 + (seed % 4200) + index * 120;
    const minimumDue = Math.max(25, Math.round(statementBalance * (0.02 + (seed % 8) / 100)));
    const dueOffset = 3 + (seed % 18) + index * 2;
    const dueDate = addDays(now, dueOffset);
    const paid = seed % 11 === 0;
    return {
      id: `bill_${card.cardId}`,
      cardId: card.cardId,
      cardName: card.displayName,
      issuer: card.issuer,
      statementBalance,
      minimumDue,
      dueDate,
      status: statusForDueDate(dueDate, paid),
      autopay: seed % 4 === 0,
      lastPaidAt: paid ? addDays(now, -(8 + (seed % 20))) : undefined,
      lastPaymentAmount: paid ? minimumDue + (seed % 200) : undefined,
    };
  });
}

export function readStoredBills(): CardBill[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CardBill[];
  } catch {
    return null;
  }
}

export function writeStoredBills(bills: CardBill[]): void {
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
}

export function readBillPayments(): BillPayment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "[]") as BillPayment[];
  } catch {
    return [];
  }
}

export function appendBillPayment(payment: BillPayment): void {
  const list = readBillPayments();
  list.unshift(payment);
  localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
}

export function formatBillMoney(amount: number): string {
  return `CA$${amount.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDueLabel(dueDate: string): string {
  const due = new Date(`${dueDate}T12:00:00`);
  return due.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function statusLabel(status: BillStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "due_soon":
      return "Due soon";
    case "overdue":
      return "Overdue";
    case "paid":
      return "Paid";
  }
}

export function statusTone(status: BillStatus): string {
  switch (status) {
    case "upcoming":
      return "bg-zinc-100 text-zinc-700";
    case "due_soon":
      return "bg-amber-50 text-amber-800";
    case "overdue":
      return "bg-red-50 text-red-700";
    case "paid":
      return "bg-emerald-50 text-emerald-700";
  }
}

export function recomputeBillStatuses(bills: CardBill[]): CardBill[] {
  return bills.map((b) => ({
    ...b,
    status: statusForDueDate(b.dueDate, b.status === "paid"),
  }));
}

/**
 * Apply a payment to a bill. Only marks the statement fully paid when the
 * payment covers the remaining balance; partial payments (minimum / custom)
 * reduce `statementBalance` and leave the bill open.
 */
export function applyBillPayment(
  bill: CardBill,
  amount: number,
  paidAt: string,
): CardBill {
  if (bill.status === "paid") return bill;
  if (!Number.isFinite(amount) || amount <= 0) return bill;

  const payment = Math.min(amount, bill.statementBalance);
  const nextBalance = Math.round((bill.statementBalance - payment) * 100) / 100;
  const fullyPaid = nextBalance <= 0;

  if (fullyPaid) {
    return {
      ...bill,
      statementBalance: 0,
      minimumDue: 0,
      status: "paid",
      lastPaidAt: paidAt,
      lastPaymentAmount: payment,
    };
  }

  return {
    ...bill,
    statementBalance: nextBalance,
    minimumDue: Math.min(bill.minimumDue, nextBalance),
    status: statusForDueDate(bill.dueDate, false),
    lastPaidAt: paidAt,
    lastPaymentAmount: payment,
  };
}
