"use client";

import dynamic from "next/dynamic";

function DemoPlayerSkeleton() {
  return (
    <div
      className="mx-auto aspect-[16/10] w-full max-w-[68.75rem] max-sm:aspect-[4/5] animate-pulse overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-gradient-to-br from-[#EAF4FD] to-[#D9ECFB]"
      aria-hidden
    />
  );
}

export const DemoPlayerLazy = dynamic(
  () => import("@/components/how-it-works/DemoPlayer").then((m) => m.DemoPlayer),
  {
    ssr: false,
    loading: () => <DemoPlayerSkeleton />,
  },
);
