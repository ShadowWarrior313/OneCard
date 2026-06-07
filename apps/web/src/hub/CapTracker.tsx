import { AlertCircle, CalendarClock, Gauge, RefreshCw } from "lucide-react";
import { getCardById } from "@/data/cards";
import type { TrackerData } from "@/server/rewards-intel/insights";

function money(value: number): string {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export function CapTracker({ trackers }: { trackers: TrackerData }) {
  return (
    <section className="oc-panel">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-ink">
        <Gauge className="h-5 w-5 text-brand-ocean" />
        Caps, credits, and rotations
      </h2>
      <div className="mt-4 space-y-3">
        {trackers.alerts.map((alert) => (
          <div key={alert.id} className={`rounded-lg border px-3 py-3 ${alert.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-sky-100 bg-sky-50"}`}>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
              {alert.kind === "rotation" ? <RefreshCw className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {alert.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-muted">{alert.detail}</p>
          </div>
        ))}
        {trackers.alerts.length === 0 && <p className="text-sm text-brand-muted">No cap or credit alerts for this wallet yet.</p>}
      </div>

      {trackers.caps.length > 0 && (
        <div className="mt-5 space-y-4 border-t border-zinc-100 pt-4">
          {trackers.caps.map((cap) => (
            <div key={cap.id}>
              <div className="flex justify-between gap-3 text-xs">
                <p className="truncate font-medium text-brand-body">{cap.label}</p>
                <p className="shrink-0 text-brand-muted">{money(cap.used)} / {money(cap.limit)}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-brand-purple transition-[width]" style={{ width: `${cap.percent}%` }} />
              </div>
              {cap.projectedHitDate && (
                <p className="mt-1 inline-flex items-center gap-1 text-[0.7rem] text-brand-muted">
                  <CalendarClock className="h-3 w-3" />
                  Projected cap date {cap.projectedHitDate} · {getCardById(cap.cardId)?.issuer}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
