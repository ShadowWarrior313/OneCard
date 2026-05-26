import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { OneCardDemoFilm } from "@/components/OneCardDemoFilm";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    step: "1",
    title: "Link your cards",
    body: "Add your reward cards to your OneCard wallet.",
  },
  {
    step: "2",
    title: "Tap once",
    body: "Pay with OneCard. We match the merchant and route automatically.",
  },
  {
    step: "3",
    title: "Earn more",
    body: "Rewards still post on your existing accounts.",
  },
];

const TRUST = [
  "Tokenized routing — card numbers never touch our servers",
  "Rewards post to the accounts you already use",
  "Built for long-term use, not a weekend hack",
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="border-b border-zinc-200 bg-white py-12 sm:py-14">
          <div className="oc-container-wide mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                How it works
              </p>
              <h1 className="oc-heading mt-2 text-3xl sm:text-4xl">
                One tap. Smarter every time.
              </h1>
              <p className="mt-3 text-base leading-relaxed text-brand-muted">
                Link your cards once. At checkout, OneCard routes each purchase to
                whichever card earns the most.
              </p>
            </div>

            <ol className="mt-10 space-y-4">
              {STEPS.map((item) => (
                <li
                  key={item.step}
                  className="flex gap-4 rounded-xl border border-zinc-200 bg-brand-surface px-5 py-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-ink text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <h2 className="font-semibold text-brand-ink">{item.title}</h2>
                    <p className="mt-1 text-sm text-brand-muted">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 overflow-hidden rounded-xl border border-zinc-200">
              <OneCardDemoFilm />
            </div>

            <ul className="mt-8 space-y-2.5">
              {TRUST.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 text-sm text-brand-body"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" />
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/simulator"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-brand-ink hover:bg-zinc-50"
              >
                Try the simulator
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
