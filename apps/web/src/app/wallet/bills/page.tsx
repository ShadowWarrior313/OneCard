import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BillsDashboard } from "@/components/bills/BillsDashboard";
import { RecurringBills } from "@/components/bills/RecurringBills";
export default function BillsPage() {
  return (
    <>
      <Header />
      <main className="min-w-0 overflow-x-clip pt-20">
        <section className="oc-section bg-brand-surface pt-24">
          <div className="oc-container-wide">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to wallet
            </Link>
            <header className="mt-4 max-w-2xl">
              <p className="oc-eyebrow inline-flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" aria-hidden />
                Bill pay
              </p>
              <h1 className="oc-display mt-3 text-3xl sm:text-4xl">Pay every bill in one place</h1>
              <p className="oc-lead max-w-lg">
                Set up recurring payments for hydro, rent, tuition, and more — auto-routed to the card that
                earns the most. Plus track your card statements and due dates without jumping between apps.
              </p>
            </header>
          </div>
        </section>

        <section className="oc-container-wide min-w-0 space-y-10 pb-16 pt-2">
          <RecurringBills />
          <div>
            <h2 className="mb-1 text-xl font-bold text-brand-ink">Card statements</h2>
            <p className="mb-5 text-sm text-brand-muted">
              Track what you owe on each linked card and submit payments.
            </p>
            <BillsDashboard />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
