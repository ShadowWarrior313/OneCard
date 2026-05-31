"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CardFinderCompareModal } from "@/components/card-finder/CardFinderCompareModal";
import { CardFinderOfferCard } from "@/components/card-finder/CardFinderOfferCard";
import { offerKey } from "@/lib/cardFinderDisplay";
import type { CreditBand, FinderResponse, Region, RewardFocus } from "@/types/cardFinder";

function creditBandFromScore(score: number): CreditBand {
  if (score < 580) return "building";
  if (score < 670) return "fair";
  if (score < 740) return "good";
  return "excellent";
}

export default function CardFinderPage() {
  const [region, setRegion] = useState<Region>("CA");
  const [isStudent, setIsStudent] = useState(false);
  const [creditBand, setCreditBand] = useState<CreditBand>("good");
  const [creditScore, setCreditScore] = useState("");
  const [rewardFocus, setRewardFocus] = useState<RewardFocus>("balanced");
  const [openedCardsLast12Months, setOpenedCardsLast12Months] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinderResponse | null>(null);
  const [compareKeys, setCompareKeys] = useState<Set<string>>(() => new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const parsedScore = Number(creditScore);
  const validScore =
    Number.isFinite(parsedScore) && parsedScore >= 300 && parsedScore <= 850
      ? Math.round(parsedScore)
      : null;
  const inferredBand = validScore ? creditBandFromScore(validScore) : null;

  async function runSearch() {
    setLoading(true);
    setError(null);
    setCompareKeys(new Set());
    setCompareOpen(false);
    try {
      const params = new URLSearchParams({
        region,
        isStudent: String(isStudent),
        creditBand,
        rewardFocus,
        openedCardsLast12Months: openedCardsLast12Months || "0",
      });
      if (validScore) params.set("creditScore", String(validScore));
      const res = await fetch(`/api/card-finder?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch offers");
      const payload = (await res.json()) as FinderResponse;
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const sortedOffers = useMemo(
    () => [...(data?.offers ?? [])].sort((a, b) => b.score - a.score),
    [data],
  );

  function toggleCompare(key: string, checked: boolean) {
    setCompareKeys((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size < 4 || next.has(key)) next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
    if (checked) setCompareOpen(true);
  }

  return (
    <>
      <Header />
      <main className="min-w-0 overflow-x-clip bg-brand-surface pt-20">
        <section className="oc-container-wide py-10 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Card Finder</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Discover cards worth applying for
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
              United States results use a structured public bonus dataset (similar depth to aggregator
              sites, without Credit Karma login). Canada results are parsed from issuer pages. We rank
              by student status, credit band, reward focus, and recent applications.
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Region</span>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region)}
                    className="mt-1.5 min-h-[44px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Credit profile</span>
                  <select
                    value={creditBand}
                    onChange={(e) => setCreditBand(e.target.value as CreditBand)}
                    className="mt-1.5 min-h-[44px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="building">Building</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Credit score (optional)
                  </span>
                  <input
                    value={creditScore}
                    onChange={(e) => setCreditScore(e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="300 - 850"
                    className="mt-1.5 min-h-[44px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-brand-muted">
                    {validScore
                      ? `Score ${validScore} maps to ${inferredBand} profile and overrides the dropdown for ranking.`
                      : "Leave blank if unknown. We do not store this value."}
                  </p>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Rewards focus</span>
                  <select
                    value={rewardFocus}
                    onChange={(e) => setRewardFocus(e.target.value as RewardFocus)}
                    className="mt-1.5 min-h-[44px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="cashback">Cashback</option>
                    <option value="travel">Travel</option>
                    <option value="points">Points</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Cards opened (12mo)</span>
                  <input
                    value={openedCardsLast12Months}
                    onChange={(e) => setOpenedCardsLast12Months(e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    className="mt-1.5 min-h-[44px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  />
                </label>

                <label className="flex items-center gap-2 self-end pb-1">
                  <input
                    type="checkbox"
                    checked={isStudent}
                    onChange={(e) => setIsStudent(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="text-sm font-medium text-brand-ink">I’m looking for student-friendly options</span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runSearch}
                  disabled={loading}
                  className="min-h-[44px] rounded-lg bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal disabled:opacity-70"
                >
                  {loading ? (region === "US" ? "Loading offers..." : "Scanning issuers...") : "Find card offers"}
                </button>
                <Link
                  href="/simulator"
                  className="min-h-[44px] rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-brand-ink hover:bg-zinc-50"
                >
                  Open simulator
                </Link>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {data && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-brand-muted">
                  {region === "US" ? (
                    <>
                      {data.sources.structured} structured US offers
                      {data.sources.scraped > 0 ? ` · ${data.sources.scraped} scraped` : ""}
                    </>
                  ) : (
                    <>
                      Checked {data.providersResponded}/{data.providersChecked} issuer pages
                    </>
                  )}{" "}
                  · updated {new Date(data.fetchedAt).toLocaleString("en-CA")}
                </div>

                {sortedOffers.length === 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-brand-muted">
                    No matching offers found. Try another profile or region.
                  </div>
                )}

                {sortedOffers.length > 0 && (
                  <>
                    {compareKeys.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setCompareOpen(true)}
                        className="sticky top-24 z-20 ml-auto block rounded-full bg-brand-ink px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-brand-charcoal"
                      >
                        Compare selected ({compareKeys.size}/4)
                      </button>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {sortedOffers.map((offer) => {
                        const key = offerKey(offer);
                        const compared = compareKeys.has(key);
                        return (
                          <CardFinderOfferCard
                            key={key}
                            offer={offer}
                            compared={compared}
                            compareDisabled={!compared && compareKeys.size >= 4}
                            onCompareChange={(checked) => toggleCompare(key, checked)}
                          />
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-brand-ink">Notes</h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-brand-muted">
                    {data.notes.map((n) => (
                      <li key={n}>• {n}</li>
                    ))}
                    <li>
                      • Scraped Canadian details are best-effort; US structured rows come from{" "}
                      <a
                        href="https://github.com/andenacitelli/credit-card-bonuses-api"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        credit-card-bonuses-api
                      </a>
                      .
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      {compareOpen && sortedOffers.length > 0 && (
        <CardFinderCompareModal
          offers={sortedOffers}
          selectedKeys={compareKeys}
          onToggle={toggleCompare}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </>
  );
}
