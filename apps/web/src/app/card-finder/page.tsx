"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type CreditBand = "building" | "fair" | "good" | "excellent";
type RewardFocus = "cashback" | "travel" | "points" | "balanced";
type Region = "CA" | "US";

type FinderOffer = {
  providerId: string;
  providerName: string;
  title: string;
  url: string;
  score: number;
  reasons: string[];
  details: {
    annualFee?: string;
    additionalUserFee?: string;
    welcomeBonus?: string;
    minSpend?: string;
    rewardsRate?: string;
    offerExpiry?: string;
    introApr?: string;
  };
};

type FinderResponse = {
  fetchedAt: string;
  providersChecked: number;
  providersResponded: number;
  offers: FinderOffer[];
  notes: string[];
};

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
  const parsedScore = Number(creditScore);
  const validScore =
    Number.isFinite(parsedScore) && parsedScore >= 300 && parsedScore <= 850
      ? Math.round(parsedScore)
      : null;
  const inferredBand = validScore ? creditBandFromScore(validScore) : null;

  async function runSearch() {
    setLoading(true);
    setError(null);
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

  const grouped = useMemo(() => {
    const map = new Map<string, FinderOffer[]>();
    for (const offer of data?.offers ?? []) {
      const list = map.get(offer.providerName) ?? [];
      list.push(offer);
      map.set(offer.providerName, list);
    }
    for (const [k, v] of map) map.set(k, v.slice(0, 4));
    return [...map.entries()];
  }, [data]);

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
              We scan public issuer pages and rank offers by your profile fit: student status,
              credit history band, reward preference, and recent application activity.
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
                  {loading ? "Scanning issuers..." : "Find card offers"}
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
                  Checked {data.providersResponded}/{data.providersChecked} issuer pages · updated{" "}
                  {new Date(data.fetchedAt).toLocaleString("en-CA")}
                </div>

                {grouped.length === 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-brand-muted">
                    No matching offers found from current scrape. Try another profile or region.
                  </div>
                )}

                {grouped.map(([provider, offers]) => (
                  <section key={provider} className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                    <h2 className="text-lg font-semibold text-brand-ink">{provider}</h2>
                    <ul className="mt-3 space-y-2.5">
                      {offers.map((offer) => (
                        <li key={`${offer.url}-${offer.title}`} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <a
                              href={offer.url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-words text-sm font-semibold text-brand-ink underline-offset-2 hover:underline"
                            >
                              {offer.title}
                            </a>
                            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                              Fit {offer.score}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {offer.details.welcomeBonus && (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                Bonus: {offer.details.welcomeBonus}
                              </span>
                            )}
                            {offer.details.annualFee && (
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                Annual fee: {offer.details.annualFee}
                              </span>
                            )}
                            {offer.details.additionalUserFee && (
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                AU fee: {offer.details.additionalUserFee}
                              </span>
                            )}
                            {offer.details.minSpend && (
                              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                                Min spend: {offer.details.minSpend}
                              </span>
                            )}
                            {offer.details.rewardsRate && (
                              <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                                Rate: {offer.details.rewardsRate}
                              </span>
                            )}
                            {offer.details.offerExpiry && (
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                Ends: {offer.details.offerExpiry}
                              </span>
                            )}
                            {offer.details.introApr && (
                              <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                                Intro APR: {offer.details.introApr}
                              </span>
                            )}
                          </div>
                          {offer.reasons.length > 0 && (
                            <p className="mt-1.5 text-xs text-brand-muted">{offer.reasons.join(" · ")}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-brand-ink">Notes</h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-brand-muted">
                    {data.notes.map((n) => (
                      <li key={n}>• {n}</li>
                    ))}
                    <li>• Parsed details are best-effort from issuer page text and should be verified before applying.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

