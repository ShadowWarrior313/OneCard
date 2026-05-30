"use client";

import { CheckCircle2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { useUserProfile } from "@/context/UserProfileContext";

export function Waitlist() {
  const { profile, displayName, joinWaitlist } = useUserProfile();
  const [name, setName] = useState("");
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setSuccessEmail(profile.email);
    }
  }, [profile]);

  const showSuccess = Boolean(successEmail);

  return (
    <section id="waitlist" className="oc-section bg-white">
      <div className="oc-container-wide">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-zinc-100 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="oc-eyebrow">Waitlist open · Canada first</p>
              <h2 className="oc-heading mt-4 text-3xl sm:text-4xl">Get your OneCard</h2>
              <p className="mt-4 leading-relaxed text-brand-muted">
                Join for launch updates. Start with the browser extension — the card comes next.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-brand-body">
                {[
                  "Connect every reward card you already own",
                  "Best card at online checkout today",
                  "Live rewards simulator on this site",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-mint" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 sm:p-8">
              {showSuccess ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-12 w-12 text-brand-mint" />
                  <h3 className="mt-4 text-xl font-semibold text-brand-ink">
                    {profile
                      ? `You're on the list, ${displayName.split(" ")[0]}`
                      : "You're on the list"}
                  </h3>
                  <p className="mt-2 text-sm text-brand-muted">
                    We&apos;ll email you at <strong>{successEmail}</strong> when it&apos;s ready.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="waitlist-name"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-body"
                    >
                      <User className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
                      Full name <span className="font-normal text-brand-muted">(optional)</span>
                    </label>
                    <input
                      id="waitlist-name"
                      type="text"
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="oc-input mt-2 bg-brand-surface/50"
                    />
                  </div>
                  <WaitlistForm
                    source="get-started"
                    name={name}
                    showSuccessInline={false}
                    onSuccess={async (email) => {
                      setSuccessEmail(email);
                      if (name.trim().length >= 2) {
                        try {
                          await joinWaitlist({ name: name.trim(), email });
                        } catch {
                          /* API success already recorded waitlist signup */
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-brand-muted">
                    Demo only — not a licensed issuer. Verify rewards with your bank.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
