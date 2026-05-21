import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { TransactionFlow } from "@/components/TransactionFlow";
import { Waitlist } from "@/components/Waitlist";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
              <TrendingUp className="h-4 w-4" />
              Optimize every tap — Amex & Big Six Canada
            </p>
            <h1 className="text-balance mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              One card.
              <br />
              <span className="text-emerald-600">Every reward maximized.</span>
            </h1>
            <p className="text-balance mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Carry a single OneCard. We route each purchase to whichever card
              in your wallet earns the most — Cobalt at restaurants, Momentum at
              groceries, Avion on flights — automatically.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#simulator"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
              >
                Try the simulator
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#waitlist"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
              >
                Join waitlist
              </Link>
            </div>
          </div>
        </section>

        {/* How it works — animated flow */}
        <section id="how-it-works" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How OneCard routes a purchase
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-600">
                You don&apos;t choose the card at checkout — the engine does, in
                real time, using merchant category and your portfolio.
              </p>
            </div>
            <TransactionFlow />
          </div>
        </section>

        {/* Value props */}
        <section className="border-y border-slate-200/80 bg-stone-50 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
            {[
              {
                stat: "+$847",
                label: "avg. extra rewards / year",
                sub: "vs always using one default card (illustrative)",
              },
              {
                stat: "0",
                label: "mental load at checkout",
                sub: "No more “which card for this?”",
              },
              {
                stat: "22",
                label: "cards supported in demo",
                sub: "Amex + Big Six Canadian issuers",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/60"
              >
                <p className="text-3xl font-bold text-emerald-600">{item.stat}</p>
                <p className="mt-2 font-medium text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <ScenarioSimulator />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
