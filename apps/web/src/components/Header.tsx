"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#simulator", label: "Try it" },
  { href: "#waitlist", label: "Get OneCard" },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            1
          </span>
          <span className="font-semibold tracking-tight text-slate-900">
            OneCard
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-600 transition hover:text-slate-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <motion.a
          href="#waitlist"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Join waitlist
        </motion.a>
      </div>
    </header>
  );
}
