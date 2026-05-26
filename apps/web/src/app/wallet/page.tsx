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
      <main className="pt-20">
        <section className="oc-section bg-gradient-to-b from-brand-purple-soft/40 to-white pb-4">
          <div className="oc-container text-center">
            <p className="oc-eyebrow inline-flex items-center justify-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" aria-hidden />
              Your wallet
            </p>
            <h1 className="oc-heading">Cards you carry</h1>
            <p className="oc-lead mx-auto max-w-md">
              Tap a card to slide it out. Set one as your business card for work purchases.
            </p>
          </div>
        </section>

        <section className="oc-container pb-12">
          <div className="grid gap-8 lg:grid-cols-[22rem_1fr] lg:items-start">
            <WalletFold />
            <aside className="space-y-4">
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
              <Link href="/#simulator" className="oc-btn-secondary w-full justify-center">
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
