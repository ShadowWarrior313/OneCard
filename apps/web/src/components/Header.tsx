"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { OneCardLogo } from "./OneCardLogo";

const links = [
  { href: "/wallet", label: "Wallet" },
  { href: "/#simulator", label: "Simulator" },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const onHome = path === "/";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = onHome && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        transparent
          ? "border-transparent bg-transparent"
          : "border-b border-zinc-200/80 bg-brand-cream/85 backdrop-blur-xl"
      }`}
    >
      <div className="oc-container-wide flex h-16 items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <OneCardLogo showWordmark light={transparent} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition ${
                transparent
                  ? "text-zinc-300 hover:text-white"
                  : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={`hidden rounded-full px-4 py-2 text-sm font-semibold transition sm:inline-flex ${
              transparent
                ? "text-zinc-200 ring-1 ring-white/25 hover:bg-white/10 hover:text-white"
                : "border border-zinc-200 bg-white text-brand-ink hover:border-zinc-300 hover:shadow-sm"
            }`}
          >
            Log in
          </Link>
          <Link
            href="/#waitlist"
            className={
              transparent
                ? "oc-btn-primary-dark !px-5 !py-2.5 text-sm"
                : "inline-flex items-center justify-center rounded-full bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal"
            }
          >
            Get started
          </Link>
          <button
            type="button"
            className={`rounded-lg p-2 md:hidden ${
              transparent
                ? "text-white hover:bg-white/10"
                : "text-brand-body hover:bg-zinc-100"
            }`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-zinc-200/80 bg-brand-cream px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-brand-body hover:bg-zinc-100"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-brand-ink hover:bg-zinc-100"
              >
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
