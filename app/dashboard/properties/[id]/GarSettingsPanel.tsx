"use client";

import { useState } from "react";
import { isValidGoogleReviewUrl } from "@/lib/google-review-url";

type GarProperty = {
  id: string;
  gar_enabled: boolean;
  gar_discount_pct: number;
  gar_trigger_delay_days: number;
  gar_google_business_url: string | null;
};

type Props = {
  property: GarProperty;
  hostFullName: string | null;
};

export function GarSettingsPanel({ property, hostFullName }: Props) {
  const [enabled, setEnabled] = useState(property.gar_enabled === true);
  const [googleUrl, setGoogleUrl] = useState(property.gar_google_business_url ?? "");
  const [discountPct, setDiscountPct] = useState(String(property.gar_discount_pct ?? 5));
  const [triggerDays, setTriggerDays] = useState(String(property.gar_trigger_delay_days ?? 5));
  const [fullName, setFullName] = useState(hostFullName ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const disabled = !enabled;

  async function save() {
    setUrlError(null);
    setSaveError(null);
    setSuccess(false);

    const url = googleUrl.trim();
    if (enabled && url && !isValidGoogleReviewUrl(url)) {
      setUrlError(
        "URL must start with https://g.page/, https://www.google.com/maps/, or https://maps.google.com/"
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gar_enabled: enabled,
          gar_discount_pct: Number(discountPct) || 5,
          gar_trigger_delay_days: Math.max(1, Number(triggerDays) || 5),
          gar_google_business_url: url || null,
          full_name: fullName.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? "Could not save settings.");
        return;
      }
      setSuccess(true);
    } catch {
      setSaveError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card max-w-xl">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <h2 className="font-display text-xl text-[var(--color-brand)]">Review Accelerator</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Thank guests after checkout and send a direct-booking reward code.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          On
        </label>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Your name (shown in guest emails)
          <input
            className="input mt-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Sarah"
            disabled={disabled}
          />
        </label>

        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Google Business review link
          <input
            className="input mt-2"
            type="url"
            value={googleUrl}
            onChange={(e) => {
              setGoogleUrl(e.target.value);
              setUrlError(null);
            }}
            placeholder="https://g.page/..."
            disabled={disabled}
          />
          <span className="mt-1 block text-[12px] font-normal normal-case tracking-normal text-[var(--color-text-muted)]">
            Paste your Google review URL here
          </span>
          {urlError ? <p className="mt-2 text-[13px] text-[var(--color-error)]">{urlError}</p> : null}
        </label>

        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Reward discount for next direct booking
          <div className="mt-2 flex items-center gap-2">
            <input
              className="input w-24"
              type="number"
              min={1}
              max={50}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              disabled={disabled}
            />
            <span className="text-sm">%</span>
          </div>
          <span className="mt-1 block text-[12px] font-normal normal-case tracking-normal text-[var(--color-text-muted)]">
            Guests receive this code after checkout. Stacks on top of the standard 10% direct booking
            discount.
          </span>
        </label>

        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Days after checkout to send
          <div className="mt-2 flex items-center gap-2">
            <input
              className="input w-24"
              type="number"
              min={1}
              max={60}
              value={triggerDays}
              onChange={(e) => setTriggerDays(e.target.value)}
              disabled={disabled}
            />
            <span className="text-sm">days</span>
          </div>
        </label>

        <button type="button" className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>

        {saveError ? <p className="text-[13px] text-[var(--color-error)]">{saveError}</p> : null}
        {success ? (
          <p className="text-[13px] font-medium text-[var(--color-brand-accent)]">
            Review Accelerator settings saved.
          </p>
        ) : null}
      </div>

      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">How it works</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <li>Guest checks out</li>
          <li>After {triggerDays || "5"} days, we send a thank-you email</li>
          <li>Email includes your Google review link</li>
          <li>Guest receives a reward code — no strings attached</li>
          <li>They use the code on their next direct booking</li>
        </ol>
      </div>
    </section>
  );
}
