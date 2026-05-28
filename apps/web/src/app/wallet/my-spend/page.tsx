import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MySpendDashboard } from "@/components/spend/MySpendDashboard";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { requireAuth } from "@/lib/server/requireAuth";

export default async function MySpendPage() {
  await requireAuth("/wallet/my-spend");
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
                <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                My Spend
              </p>
              <h1 className="oc-display mt-3 text-3xl sm:text-4xl">Where your money goes</h1>
              <p className="oc-lead max-w-lg">
                Track spend and rewards by card and category. Log purchases from the simulator,
                then compare week to week, month to month, or quarter over quarter.
              </p>
            </header>
          </div>
        </section>

        <section className="oc-container-wide min-w-0 max-w-full pb-16 pt-2">
          <MySpendDashboard />
        </section>
      </main>
      <Footer />
    </>
  );
}
