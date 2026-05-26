"use client";

import { Search } from "lucide-react";
import type { MerchantGroup } from "@/data/merchants";

export function MerchantGroupSearch({
  group,
  query,
  onQueryChange,
}: {
  group: MerchantGroup;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={`Search ${group.toLowerCase()}…`}
        className="oc-input w-full py-2.5 pl-9 pr-3 text-sm"
        aria-label={`Search merchants in ${group}`}
        autoComplete="off"
      />
    </div>
  );
}
