import { ShieldCheck, Lock, Wallet } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    body: "Tokenized routing — your full card numbers never touch our servers.",
  },
  {
    icon: Lock,
    title: "PCI by design",
    body: "Built for tokenized PAN flows from day one, not bolted on later.",
  },
  {
    icon: Wallet,
    title: "You keep your rewards",
    body: "Points and cashback post to the same accounts you use today.",
  },
];

export function TrustSection() {
  return (
    <section className="border-t border-zinc-200 bg-brand-surface py-16 sm:py-20">
      <div className="oc-container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Trust
          </p>
          <h2 className="oc-heading mt-3">Built for the long term</h2>
          <p className="oc-lead mx-auto max-w-lg">
            Secure, straightforward, and designed like a product you&apos;d trust with
            your wallet.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-xl border border-zinc-200 bg-white p-6 text-center"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-brand-ink">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-brand-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
