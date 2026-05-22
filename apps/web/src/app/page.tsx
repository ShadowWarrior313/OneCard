import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { PosTapAnimation } from "@/components/PosTapAnimation";
import { TransactionFlow } from "@/components/TransactionFlow";
import { Waitlist } from "@/components/Waitlist";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="oc-hero">
          <div className="oc-hero-glow" aria-hidden />
          <div className="oc-container oc-hero-inner">
            <p className="oc-badge">
              <TrendingUp className="h-4 w-4" aria-hidden />
              Optimize every tap — Amex & Big Six Canada
            </p>
            <h1 className="oc-hero-title">
              One card.
              <br />
              <span className="oc-hero-accent">Every reward maximized.</span>
            </h1>
            <p className="oc-hero-lead">
              Carry a single OneCard. We route each purchase to whichever card
              in your wallet earns the most — Cobalt at restaurants, Momentum at
              groceries, Avion on flights — automatically.
            </p>
            <div className="oc-hero-animation">
              <PosTapAnimation />
            </div>
            <div className="oc-hero-cta">
              <Link href="#simulator" className="oc-btn oc-btn-primary">
                Try the simulator
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="#waitlist" className="oc-btn oc-btn-secondary">
                Join waitlist
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="oc-section oc-flow-section">
          <div className="oc-container">
            <header className="mb-10 text-center">
              <h2 className="oc-section-title">
                How OneCard routes a purchase
              </h2>
              <p className="oc-section-lead">
                You don&apos;t choose the card at checkout — the engine does, in
                real time, using merchant category and your portfolio.
              </p>
            </header>
            <TransactionFlow />
          </div>
        </section>

        <section className="oc-stats-section" aria-label="Key benefits">
          <div className="oc-container oc-stats-grid">
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
              <article key={item.label} className="oc-stat-card">
                <p className="oc-stat-value">{item.stat}</p>
                <p className="oc-stat-label">{item.label}</p>
                <p className="oc-stat-sub">{item.sub}</p>
              </article>
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
