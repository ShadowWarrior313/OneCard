"use client";

import { Maximize2 } from "lucide-react";
import type { FeatureCardConfig, FeatureId } from "@/components/how-it-works/demoData";
import { MockupFrame } from "@/components/how-it-works/MockupFrame";
import { RoutingTeaser } from "@/components/how-it-works/RoutingTeaser";
import { SpendScene } from "@/components/how-it-works/scenes/SpendScene";
import { BillsScene } from "@/components/how-it-works/scenes/BillsScene";
import { WalletStackScene, TokenScene } from "@/components/how-it-works/scenes/WalletStackScene";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";

function FeatureMockup({ id, lead }: { id: FeatureId; lead?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const aspect = lead ? "16 / 8" : "16 / 10";

  return (
    <MockupFrame
      density="card"
      aspectRatio={aspect}
      className={`h-full min-h-[11rem] ${lead ? "md:min-h-[13rem]" : ""}`}
    >
      {id === "routing" && <RoutingTeaser />}
      {id === "wallet" && (
        <WalletStackScene reducedMotion={reducedMotion} density="card" />
      )}
      {id === "spend" && (
        <SpendScene progress={0.75} density="card" reducedMotion={reducedMotion} />
      )}
      {id === "bills" && (
        <BillsScene progress={0.7} density="card" reducedMotion={reducedMotion} />
      )}
      {id === "tokenized" && (
        <TokenScene reducedMotion={reducedMotion} density="card" />
      )}
    </MockupFrame>
  );
}

export function FeatureCard({
  config,
  onExpand,
}: {
  config: FeatureCardConfig;
  onExpand: () => void;
}) {
  return (
    <article
      className={`group relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[1.25rem] border border-zinc-200/80 shadow-[0_1px_2px_rgba(11,11,15,0.05),0_16px_40px_-16px_rgba(11,11,15,0.12)] transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(11,11,15,0.07),0_24px_56px_-12px_rgba(11,11,15,0.18)] ${
        config.lead ? "md:col-span-2 md:grid md:grid-cols-[1fr_1.1fr] md:items-stretch" : ""
      }`}
      style={{ background: config.gradient }}
      onClick={onExpand}
    >
      <div
        className={`flex min-w-0 flex-col p-5 sm:p-6 ${config.lead ? "md:justify-center" : ""}`}
      >
        <h3 className="pr-10 text-lg font-semibold tracking-tight text-brand-ink sm:text-xl">
          {config.headline}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-brand-body">{config.subcopy}</p>
      </div>

      <div
        className={`relative min-h-[11rem] overflow-hidden ${config.lead ? "md:min-h-[14rem]" : ""}`}
      >
        <FeatureMockup id={config.id} lead={config.lead} />
      </div>

      {/* Expand button — brightens on hover */}
      <button
        type="button"
        aria-label={`Expand ${config.headline}`}
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white/70 text-brand-muted opacity-70 transition-all duration-200 group-hover:border-sky-200 group-hover:bg-white group-hover:text-sky-600 group-hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </article>
  );
}
