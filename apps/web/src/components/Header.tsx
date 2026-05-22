"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { OneCardLogo } from "./OneCardLogo";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#simulator", label: "Try it" },
  { href: "#waitlist", label: "Get OneCard" },
];

export function Header() {
  return (
    <header className="oc-header">
      <div className="oc-container oc-header-inner">
        <Link href="/" className="oc-logo">
          <OneCardLogo showWordmark />
        </Link>
        <nav className="oc-nav" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <motion.a
          href="#waitlist"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="oc-btn-nav"
        >
          Join waitlist
        </motion.a>
      </div>
    </header>
  );
}
