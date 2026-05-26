"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InteractivePhoneDemo } from "@/components/landing/InteractivePhoneDemo";

export function InteractiveDemo() {
  return (
    <section className="oc-section border-t border-zinc-200 bg-white">
      <div className="oc-container-wide">
        <div className="grid min-w-0 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Live demo · Tap anything
            </p>
            <h2 className="oc-heading mt-3 text-3xl sm:text-4xl">
              See routing before you sign up
            </h2>
            <p className="oc-lead max-w-md">
              Scroll through the app demo on your phone or desktop. Tap a purchase to
              see which card earns the most — open the wallet to pull cards out of
              the leather fold.
            </p>
            <Link
              href="/simulator"
              className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
            >
              Open full simulator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="w-full max-w-[min(340px,100%)]">
              <InteractivePhoneDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
