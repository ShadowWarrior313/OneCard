import { CARD_COUNT } from "@/data/cards";
import { Check, TrendingUp, Wallet, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Link your whole wallet",
    titleIcon: Wallet,
    description:
      "Add every Amex and Big Six card you carry. OneCard remembers where each one earns the most.",
    highlight: `${CARD_COUNT} cards supported`,
    cta: "Build your wallet",
    href: "/wallet",
    visual: WalletStackVisual,
  },
  {
    title: "Tap once, route smarter",
    titleIcon: Zap,
    description:
      "Pay with a single physical OneCard. We pick the best underlying card at every merchant — no app at checkout.",
    highlight: "Instant MCC routing",
    cta: "See how it works",
    href: "#simulator",
    visual: OneCardVisual,
  },
  {
    title: "Keep every reward",
    titleIcon: TrendingUp,
    description:
      "Points and cashback still post on your existing cards. See exactly how much extra you earn vs your default.",
    highlight: "Live rewards simulator",
    cta: "Try the simulator",
    href: "#simulator",
    visual: RewardsVisual,
  },
] as const;

export function FeatureShowcase() {
  return (
    <section className="bg-[#f2f5f7] py-10 sm:py-12">
      <div className="oc-container">
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {features.map(
            ({ title, titleIcon: TitleIcon, description, highlight, cta, href, visual: Visual }) => (
              <article
                key={title}
                className="flex flex-col items-center rounded-[1.75rem] bg-white px-6 pb-8 pt-8 text-center shadow-card sm:px-8 sm:pb-10 sm:pt-10"
              >
                <div className="mb-8 flex h-[11.5rem] w-full items-center justify-center">
                  <Visual />
                </div>
                <h3 className="inline-flex items-center justify-center gap-2 text-xl font-bold tracking-tight text-brand-ink sm:text-[1.35rem]">
                  <TitleIcon className="h-5 w-5 shrink-0 text-brand-ocean" aria-hidden />
                  {title}
                </h3>
                <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-brand-muted">
                  {description}
                </p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-ink">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-mint">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="underline decoration-brand-ink/30 underline-offset-2">
                    {highlight}
                  </span>
                </p>
                <Link
                  href={href}
                  className="oc-btn-ghost mt-6 w-full max-w-[14rem] sm:w-auto"
                >
                  {cta}
                </Link>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function WalletStackVisual() {
  const cards = [
    {
      label: "Dining rewards",
      value: "5×",
      tint: "bg-orange-50",
      offset: "translate-y-4 -rotate-6 scale-[0.92]",
      z: "z-0",
    },
    {
      label: "Travel rewards",
      value: "3×",
      tint: "bg-sky-50",
      offset: "translate-y-2 rotate-3 scale-[0.96]",
      z: "z-10",
    },
    {
      label: "Groceries rewards",
      value: "4×",
      tint: "bg-white",
      offset: "translate-y-0",
      z: "z-20 shadow-lg",
    },
  ];

  return (
    <div className="relative h-[10rem] w-[12rem]">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`absolute inset-x-0 top-0 mx-auto w-[11rem] rounded-2xl border border-slate-200/90 p-4 ${card.tint} ${card.offset} ${card.z}`}
        >
          <p className="text-left text-[0.65rem] font-medium text-brand-muted">
            {card.label}
          </p>
          <p className="mt-1 text-left text-3xl font-bold tracking-tight text-brand-ink">
            {card.value}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="flex h-5 w-7 rounded-sm bg-gradient-to-r from-red-500 via-amber-400 to-brand-ocean" />
            <span className="font-mono text-[0.6rem] text-slate-400">•••• 4821</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OneCardVisual() {
  return (
    <div
      className="relative w-[12.5rem] rounded-2xl shadow-xl"
      style={{
        background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)",
      }}
    >
      <div className="relative aspect-[1.586] w-full rounded-[0.9rem] p-4 text-white">
        <div className="flex items-start justify-between">
          <div
            className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200/90 to-amber-400/80"
            aria-hidden
          />
          <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-70" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
            />
          </svg>
        </div>
        <p className="mt-10 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-white/50">
          OneCard
        </p>
        <p className="mt-0.5 text-sm font-bold tracking-wide">JOHN DOE</p>
        <div className="absolute bottom-4 right-4 flex gap-1 opacity-50">
          <span className="h-5 w-5 rounded-full bg-red-500" />
          <span className="h-5 w-5 rounded-full bg-amber-400" />
        </div>
      </div>
    </div>
  );
}

function RewardsVisual() {
  return (
    <div className="flex w-[10.5rem] flex-col items-center rounded-2xl border border-slate-200/90 bg-slate-50 px-6 py-6 shadow-sm">
      <span className="rounded-md bg-white px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand-muted ring-1 ring-slate-200">
        CAD
      </span>
      <p className="mt-3 text-4xl font-bold tracking-tight text-brand-ink">+$6.45</p>
      <p className="mt-1 text-sm font-medium text-brand-muted">vs default card</p>
      <p className="mt-4 rounded-full bg-brand-mint-soft px-3 py-1 text-xs font-semibold text-brand-ink">
        Uber Eats · dining
      </p>
    </div>
  );
}
