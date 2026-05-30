"use client";

import { useState } from "react";
import { FEATURE_CARDS } from "@/components/how-it-works/demoData";
import { FeatureCard } from "@/components/how-it-works/FeatureCard";
import { FeatureBentoShell, FeatureModal } from "@/components/how-it-works/FeatureModal";

export function FeatureBento() {
  const [expanded, setExpanded] = useState<(typeof FEATURE_CARDS)[number] | null>(null);

  return (
    <>
      <FeatureBentoShell>
        {FEATURE_CARDS.map((config) => (
          <FeatureCard key={config.id} config={config} onExpand={() => setExpanded(config)} />
        ))}
      </FeatureBentoShell>
      <FeatureModal feature={expanded} onClose={() => setExpanded(null)} />
    </>
  );
}
