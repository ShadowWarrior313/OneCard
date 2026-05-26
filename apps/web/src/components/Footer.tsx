import Link from "next/link";
import { OneCardLogo } from "./OneCardLogo";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-12">
      <div className="oc-container-wide">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <OneCardLogo showWordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-muted">
              One card for every purchase. Maximum rewards from the cards you
              already carry.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-ink">Product</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-brand-muted">
              <li>
                <Link href="/how-it-works" className="hover:text-brand-ink">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/simulator" className="hover:text-brand-ink">
                  Simulator
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-brand-ink">
                  Wallet
                </Link>
              </li>
              <li>
                <Link href="/get-started" className="hover:text-brand-ink">
                  Get started
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-ink">Legal</h4>
            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              Demo only — not a licensed issuer. Verify rewards with your bank.
            </p>
          </div>
        </div>
        <p className="mt-12 border-t border-zinc-100 pt-8 text-center text-xs text-brand-muted sm:text-left">
          © {new Date().getFullYear()} OneCard
        </p>
      </div>
    </footer>
  );
}
