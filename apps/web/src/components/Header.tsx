"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogIn, Menu, Play, UserPlus, Wallet, X } from "lucide-react";
import { useState } from "react";
import { OneCardLogo } from "./OneCardLogo";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/#simulator", label: "Try it", icon: Play },
];

function navClass(active: boolean) {
  return active
    ? "bg-brand-purple-soft text-brand-purple"
    : "text-brand-body hover:bg-slate-50 hover:text-brand-ink";
}

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return path === "/";
    if (href === "/wallet") return path === "/wallet";
    return false;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="oc-container flex h-[4.25rem] items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <OneCardLogo showWordmark />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => {
            const Icon = l.icon;
            return (
            <Link
              key={l.href}
              href={l.href}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${navClass(isActive(l.href))}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {l.label}
            </Link>
          );})}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/wallet"
            className="hidden items-center gap-1.5 text-sm font-medium text-brand-body sm:inline-flex hover:text-brand-purple"
          >
            <LogIn className="h-4 w-4 shrink-0" aria-hidden />
            Log in
          </Link>
          <Link href="/#waitlist" className="oc-btn-primary !px-5 !py-2.5 text-sm">
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
            Sign up
          </Link>
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-brand-body hover:bg-slate-100 md:hidden"
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
          className="border-t border-slate-100 bg-white px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {links.map((l) => {
              const Icon = l.icon;
              return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${navClass(isActive(l.href))}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {l.label}
                </Link>
              </li>
            );})}
          </ul>
        </nav>
      )}
    </header>
  );
}
