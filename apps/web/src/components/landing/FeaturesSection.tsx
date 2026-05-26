import Link from "next/link";
import { ArrowRight, CreditCard, Route, Shield } from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Link your cards",
    body: "Connect the reward cards you already carry. No new accounts to manage.",
  },
  {
    icon: Route,
    title: "Automatic routing",
    body: "Merchant category is matched at tap. The best card is selected every time.",
  },
  {
    icon: Shield,
    title: "Your rewards stay yours",
    body: "Points and cashback post to your existing accounts. We only route the charge.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-zinc-200 bg-brand-surface py-16 sm:py-20">
      <div className="oc-container-wide">
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl border border-zinc-200 bg-white p-6">
              <Icon className="h-5 w-5 text-brand-ink" strokeWidth={1.75} />
              <h3 className="mt-4 text-base font-semibold text-brand-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-brand-ink">Ready to try it?</p>
            <p className="mt-1 text-sm text-brand-muted">
              Build a wallet, run scenarios, or join the waitlist.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-zinc-50"
            >
              Open wallet
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
