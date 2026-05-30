import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { HeroCardStack } from "./HeroCardStack";

export function HeroSection() {
  return (
    <section className="relative overflow-visible bg-[#0c0c0e] pt-28 pb-28 sm:overflow-x-clip sm:pt-32 sm:pb-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_70%_20%,rgba(255,255,255,0.07),transparent_55%)]" />

      <div className="oc-container-wide relative grid min-w-0 items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Canada · Every card you carry
          </p>

          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Your entire wallet.{" "}
            <span className="text-zinc-300">One card.</span>
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-400 lg:mx-0 mx-auto">
            Tap once at checkout. OneCard routes each purchase to the card that
            earns the most — automatically.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-ink hover:bg-zinc-100"
            >
              Get OneCard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-white/5"
            >
              <Wallet className="h-4 w-4" />
              Open wallet
            </Link>
          </div>

          <div className="mx-auto mt-6 max-w-md lg:mx-0">
            <WaitlistForm source="hero" variant="dark" />
          </div>
        </div>

        {/* Card deck — full-width row so the stack centres on mobile */}
        <div className="col-span-1 flex w-full min-w-0 justify-center overflow-visible lg:col-span-1">
          <HeroCardStack />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
