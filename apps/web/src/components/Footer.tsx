import Link from "next/link";
import { FlaskConical, Sparkles, Wallet } from "lucide-react";
import { OneCardLogo } from "./OneCardLogo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-8">
      <div className="oc-container">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <OneCardLogo showWordmark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-muted">
              One card for every purchase. Maximum rewards from the cards you
              already carry.
            </p>
          </div>
          <div>
            <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
              Product
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-brand-muted">
              <li>
                <Link href="/wallet" className="inline-flex items-center gap-1.5 hover:text-brand-purple">
                  <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Wallet
                </Link>
              </li>
              <li>
                <Link href="/#simulator" className="inline-flex items-center gap-1.5 hover:text-brand-purple">
                  <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Simulator
                </Link>
              </li>
              <li>
                <Link href="/#waitlist" className="inline-flex items-center gap-1.5 hover:text-brand-purple">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Early access
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-ink">Legal</h4>
            <p className="mt-3 text-sm text-brand-muted">
              Demo only — not a licensed issuer. Verify rewards with your bank.
            </p>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-brand-muted sm:text-left">
          © {new Date().getFullYear()} OneCard
        </p>
      </div>
    </footer>
  );
}
