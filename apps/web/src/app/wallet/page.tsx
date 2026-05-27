import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WalletFold } from "@/components/wallet/WalletFold";
import { CardPicker } from "@/components/wallet/CardPicker";
import { BusinessCardPanel } from "@/components/wallet/BusinessCardPanel";
import Link from "next/link";
import { Calculator, CreditCard, Wallet } from "lucide-react";

export default function WalletPage() {
  return (
    <>
      <Header />
      <main className="min-w-0 overflow-x-clip pt-20">
        <section className="oc-section bg-brand-surface pt-24">
          <div className="oc-container-wide">
            <header className="mb-10 max-w-2xl">
              <p className="oc-eyebrow inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" aria-hidden />
                Your wallet
              </p>
              <h1 className="oc-display mt-3 text-3xl sm:text-4xl lg:text-5xl">
                Cards you carry
              </h1>
              <p className="oc-lead max-w-md">
                Tap a card to slide it out. Set one as your business card for work purchases.
              </p>
            </header>
          </div>
        </section>

        <section className="oc-container-wide min-w-0 overflow-visible pb-16">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
            <div className="flex min-w-0 justify-center overflow-visible lg:justify-start">
              <WalletFold />
            </div>
            <aside className="min-w-0 space-y-4">
              <BusinessCardPanel />
              <div className="oc-panel">
                <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-ink">
                  <CreditCard className="h-5 w-5 shrink-0 text-brand-ocean" aria-hidden />
                  Add or remove cards
                </h2>
                <p className="mt-1 text-sm text-brand-muted">
                  Changes save automatically in your browser.
                </p>
                <div className="mt-4">
                  <CardPicker />
                </div>
              </div>
              <Link
                href="/simulator"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal"
              >
                <Calculator className="h-4 w-4 shrink-0" aria-hidden />
                Test a purchase with this wallet
              </Link>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
