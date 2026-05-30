"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { OneCardLogo } from "./OneCardLogo";
import { useUserProfile } from "@/context/UserProfileContext";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/wallet", label: "Wallet" },
  { href: "/wallet/bills", label: "Bill Pay" },
  { href: "/wallet/my-spend", label: "My Spend" },
  { href: "/card-finder", label: "Card Finder" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/wallet") return pathname === "/wallet";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const path = usePathname();
  const { isLoggedIn, logout } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const onHome = path === "/";
  const transparent = onHome && !scrolled && !open;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[120] transition-colors duration-300 ${
        transparent
          ? "border-transparent bg-transparent"
          : "border-b border-zinc-200 bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="oc-container-wide flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link href="/" onClick={() => setOpen(false)} className="shrink-0">
          <OneCardLogo showWordmark light={transparent} />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
          {links.map((l) => {
            const active = isNavActive(path, l.href);
            return (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition ${
                transparent
                  ? active
                    ? "text-white"
                    : "text-zinc-300 hover:text-white"
                  : active
                    ? "text-brand-ink"
                    : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {l.label}
            </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className={`hidden rounded-lg px-3 py-2 text-sm font-medium sm:inline-flex ${
                transparent
                  ? "text-zinc-200 hover:text-white"
                  : "text-brand-body hover:text-brand-ink"
              }`}
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className={`hidden rounded-lg px-3 py-2 text-sm font-medium sm:inline-flex ${
                transparent
                  ? "text-zinc-200 hover:text-white"
                  : "text-brand-body hover:text-brand-ink"
              }`}
            >
              Log in
            </Link>
          )}
          <Link
            href={isLoggedIn ? "/wallet" : "/get-started"}
            className={`hidden rounded-lg px-4 py-2 text-sm font-semibold sm:inline-flex ${
              transparent
                ? "bg-white text-brand-ink hover:bg-zinc-100"
                : "bg-brand-ink text-white hover:bg-brand-charcoal"
            }`}
          >
            {isLoggedIn ? "Open wallet" : "Get started"}
          </Link>
          <button
            type="button"
            className={`rounded-lg p-2 lg:hidden ${
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
          className="border-t border-zinc-200 bg-white px-4 py-3 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-3 text-sm font-medium hover:bg-zinc-50 ${
                    isNavActive(path, l.href)
                      ? "bg-zinc-50 font-semibold text-brand-ink"
                      : "text-brand-body"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-brand-body hover:bg-zinc-50"
                >
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-brand-body hover:bg-zinc-50"
                >
                  Log in
                </Link>
              )}
            </li>
            <li className="pt-2">
              <Link
                href={isLoggedIn ? "/wallet" : "/get-started"}
                onClick={() => setOpen(false)}
                className="block rounded-lg bg-brand-ink px-3 py-3 text-center text-sm font-semibold text-white"
              >
                {isLoggedIn ? "Open wallet" : "Get started"}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
