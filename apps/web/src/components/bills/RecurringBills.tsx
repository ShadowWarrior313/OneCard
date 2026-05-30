"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Home,
  KeyRound,
  Pencil,
  Plus,
  Receipt,
  Repeat,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Tv,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { getCardById } from "@/data/cards";
import { IssuerLogo } from "@/components/IssuerLogo";
import {
  BILL_CATEGORIES,
  BILL_FREQUENCIES,
  bestCardForCategory,
  computeNextDate,
  formatBillDate,
  formatMoney,
  frequencyShort,
  monthlyEquivalent,
  readRecurringBills,
  seedRecurringBills,
  writeRecurringBills,
  type BillCategory,
  type BillCardChoice,
  type BillFrequency,
  type RecurringBill,
} from "@/lib/recurringBills";

const CATEGORY_ICON: Record<BillCategory, LucideIcon> = {
  utilities: Zap,
  mortgage: Home,
  rent: KeyRound,
  tuition: GraduationCap,
  phone: Smartphone,
  internet: Wifi,
  insurance: Shield,
  subscription: Tv,
  other: Receipt,
};

interface FormState {
  category: BillCategory;
  name: string;
  amount: string;
  frequency: BillFrequency;
  card: BillCardChoice;
  autopay: boolean;
}

const EMPTY_FORM: FormState = {
  category: "utilities",
  name: "",
  amount: "",
  frequency: "monthly",
  card: "auto",
  autopay: true,
};

export function RecurringBills() {
  const { cards } = useWallet();
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    setBills(readRecurringBills() ?? seedRecurringBills());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeRecurringBills(bills);
  }, [bills, hydrated]);

  const resolveCard = useCallback(
    (bill: RecurringBill): { label: string; issuer?: string; cardId?: string; auto: boolean } => {
      if (bill.card === "auto") {
        const best = bestCardForCategory(cards, bill.category, bill.amount);
        const card = best ? getCardById(best.cardId) : undefined;
        return { label: best?.displayName ?? "Best available card", issuer: card?.issuer, cardId: card?.cardId, auto: true };
      }
      const card = getCardById(bill.card);
      return { label: card?.displayName ?? "Selected card", issuer: card?.issuer, cardId: card?.cardId, auto: false };
    },
    [cards],
  );

  const { monthlyTotal, autoCount } = useMemo(
    () => ({
      monthlyTotal: bills.reduce((s, b) => s + monthlyEquivalent(b.amount, b.frequency), 0),
      autoCount: bills.filter((b) => b.card === "auto").length,
    }),
    [bills],
  );

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(bill: RecurringBill) {
    setEditingId(bill.id);
    setForm({
      category: bill.category,
      name: bill.name,
      amount: String(bill.amount),
      frequency: bill.frequency,
      card: bill.card,
      autopay: bill.autopay,
    });
    setShowForm(true);
  }

  function save() {
    const amount = Number(form.amount);
    const name = form.name.trim() || BILL_CATEGORIES.find((c) => c.value === form.category)!.placeholder;
    if (!Number.isFinite(amount) || amount <= 0) return;

    if (editingId) {
      setBills((prev) =>
        prev.map((b) =>
          b.id === editingId ? { ...b, category: form.category, name, amount, frequency: form.frequency, card: form.card, autopay: form.autopay } : b,
        ),
      );
    } else {
      setBills((prev) => [
        {
          id: `bill_${Date.now()}`,
          category: form.category,
          name,
          amount,
          frequency: form.frequency,
          card: form.card,
          autopay: form.autopay,
          nextDate: computeNextDate(form.frequency),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function remove(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  function toggleAutopay(id: string) {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, autopay: !b.autopay } : b)));
  }

  if (!hydrated) return <div className="oc-panel h-48 animate-pulse rounded-2xl" />;

  return (
    <div className="oc-panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Recurring bills &amp; auto-pay</h2>
          <p className="mt-1 max-w-md text-sm text-brand-muted">
            Set up hydro, mortgage, rent, tuition, or any recurring service. OneCard routes each
            payment to the card that earns the most — or pick the card yourself.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal"
        >
          <Plus className="h-4 w-4" /> Add a bill
        </button>
      </div>

      {/* summary */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Per month" value={formatMoney(monthlyTotal)} />
        <Stat label="Active bills" value={String(bills.length)} />
        <Stat label="Auto-routed" value={`${autoCount} of ${bills.length}`} />
      </div>

      {/* form */}
      {showForm && (
        <BillForm
          form={form}
          setForm={setForm}
          editing={Boolean(editingId)}
          cards={cards}
          onSave={save}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {/* list */}
      <ul className="mt-5 space-y-2.5">
        {bills.length === 0 && (
          <li className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-brand-muted">
            No recurring bills yet. Add hydro, rent, tuition, or any service to get started.
          </li>
        )}
        {bills.map((bill) => {
          const Icon = CATEGORY_ICON[bill.category];
          const routed = resolveCard(bill);
          return (
            <li
              key={bill.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-ink">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-brand-ink">{bill.name}</p>
                <p className="text-xs text-brand-muted">
                  {formatMoney(bill.amount)} · {frequencyShort(bill.frequency)} · next {formatBillDate(bill.nextDate)}
                </p>
              </div>

              {/* routing */}
              <div className="flex items-center gap-2 rounded-lg bg-brand-surface px-2.5 py-1.5">
                {routed.issuer && routed.cardId && (
                  <IssuerLogo issuer={routed.issuer} cardId={routed.cardId} size={16} className="rounded" />
                )}
                <span className="text-xs font-semibold text-brand-ink">
                  {routed.auto && <Sparkles className="mr-1 inline h-3 w-3 text-brand-purple" />}
                  {routed.auto ? "Auto → " : ""}
                  {routed.label}
                </span>
              </div>

              {/* autopay toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={bill.autopay}
                aria-label={`Auto-pay for ${bill.name}`}
                onClick={() => toggleAutopay(bill.id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  bill.autopay ? "bg-emerald-500" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    bill.autopay ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${bill.name}`}
                  onClick={() => openEdit(bill)}
                  className="rounded-lg p-2 text-brand-muted hover:bg-zinc-100 hover:text-brand-ink"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${bill.name}`}
                  onClick={() => remove(bill.id)}
                  className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-brand-muted">
        <Repeat className="h-3.5 w-3.5" />
        Demo only — no real payments are scheduled or sent.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-surface px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-0.5 text-base font-bold text-brand-ink">{value}</p>
    </div>
  );
}

function BillForm({
  form,
  setForm,
  editing,
  cards,
  onSave,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  editing: boolean;
  cards: ReturnType<typeof useWallet>["cards"];
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-zinc-200 bg-brand-surface/60 p-4">
      <p className="mb-3 text-sm font-semibold text-brand-ink">{editing ? "Edit bill" : "New recurring bill"}</p>

      {/* category chips */}
      <div className="flex flex-wrap gap-2">
        {BILL_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c.value];
          const active = form.category === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm({ ...form, category: c.value })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-brand-ink bg-brand-ink text-white"
                  : "border-zinc-200 bg-white text-brand-body hover:border-zinc-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-body">Bill name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={BILL_CATEGORIES.find((c) => c.value === form.category)?.placeholder}
            className="oc-input w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-body">Amount (CA$)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="oc-input w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-body">How often</span>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value as BillFrequency })}
            className="oc-input w-full"
          >
            {BILL_FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-body">Pay with</span>
          <select
            value={form.card}
            onChange={(e) => setForm({ ...form, card: e.target.value })}
            className="oc-input w-full"
          >
            <option value="auto">Auto-route to best card</option>
            {cards.map((c) => (
              <option key={c.cardId} value={c.cardId}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-body">
          <button
            type="button"
            role="switch"
            aria-checked={form.autopay}
            onClick={() => setForm({ ...form, autopay: !form.autopay })}
            className={`relative h-6 w-11 rounded-full transition-colors ${form.autopay ? "bg-emerald-500" : "bg-zinc-300"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.autopay ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
          Auto-pay on the due date
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-brand-body hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-charcoal"
          >
            {editing ? "Save changes" : "Add bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
