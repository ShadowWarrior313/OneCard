import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { PosTapAnimation } from "@/components/PosTapAnimation";
import { Waitlist } from "@/components/Waitlist";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { ProductVideoSection } from "@/components/ProductVideoSection";
import { CARD_COUNT } from "@/data/cards";
import { Sparkles, Wallet, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-purple-soft/50 via-white to-brand-ocean-soft/30 pb-10 pt-20 sm:pt-22">
          <div className="oc-container grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="text-center lg:text-left">
              <p className="oc-eyebrow">Canada · Amex & Big Six</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                The smart way to pay with{" "}
                <span className="bg-gradient-to-r from-brand-purple via-brand-ocean to-brand-mint bg-clip-text text-transparent">
                  every reward you have
                </span>
              </h1>
              <p className="oc-lead mx-auto max-w-lg lg:mx-0">
                One physical card. Your whole wallet behind it. We pick the best
                card at every tap.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/#waitlist" className="oc-btn-primary">
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  Get OneCard
                </Link>
                <Link href="/wallet" className="oc-btn-secondary">
                  <Wallet className="h-4 w-4" />
                  Open wallet
                </Link>
              </div>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-brand-muted shadow-sm">
                <Zap className="h-4 w-4 text-brand-ocean" />
                <strong className="text-brand-purple">{CARD_COUNT} cards</strong>{" "}
                supported
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex w-fit flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-lift">
                <PosTapAnimation />
              </div>
            </div>
          </div>
        </section>

        <FeatureShowcase />

        <section className="oc-section">
          <div className="oc-container">
            <header className="mb-8 text-center">
              <h2 className="oc-heading">Make every purchase count</h2>
              <p className="oc-lead mx-auto max-w-xl">Link once. Tap once. Earn more.</p>
            </header>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Wallet,
                  title: "Build your wallet",
                  body: "Add cards and see where each one shines.",
                  href: "/wallet",
                  cta: "Go to wallet",
                },
                {
                  icon: Zap,
                  title: "Tap once",
                  body: "OneCard routes to the optimal card automatically.",
                  href: "#simulator",
                  cta: "See it work",
                },
                {
                  icon: BarChart3,
                  title: "Compare rewards",
                  body: "Visual breakdown vs your default card.",
                  href: "#simulator",
                  cta: "Try simulator",
                },
              ].map(({ icon: Icon, title, body, href, cta }) => (
                <article key={title} className="oc-panel transition hover:shadow-lift">
                  <Icon className="h-7 w-7 text-brand-ocean" />
                  <h3 className="mt-4 font-bold text-brand-ink">{title}</h3>
                  <p className="mt-2 text-sm text-brand-muted">{body}</p>
                  <Link href={href} className="oc-link mt-4 inline-block text-sm">
                    {cta} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ScenarioSimulator />
        <ProductVideoSection />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
