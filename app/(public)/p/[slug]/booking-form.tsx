"use client";

import { useMemo, useState } from "react";
import { computePriceBreakdown, money } from "@/lib/pricing";

type Property = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  cleaning_fee: number | null;
  images: string[] | null;
};

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
}

function hasBlockedOverlap(
  checkIn: Date,
  checkOut: Date,
  blocked: string[]
): boolean {
  const set = new Set(blocked);
  const cur = new Date(checkIn);
  while (cur < checkOut) {
    if (set.has(formatYmd(cur))) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

export function BookingForm({
  property,
  blockedDates,
}: {
  property: Property;
  blockedDates: string[];
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return formatYmd(d);
  }, []);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [rewardInput, setRewardInput] = useState("");
  const [rewardPct, setRewardPct] = useState(0);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInD = checkIn ? parseYmd(checkIn) : null;
  const checkOutD = checkOut ? parseYmd(checkOut) : null;

  const dateError = useMemo(() => {
    if (!checkInD || !checkOutD) return null;
    if (checkOutD <= checkInD) return "Check-out must be after check-in.";
    if (hasBlockedOverlap(checkInD, checkOutD, blockedDates)) {
      return "Those dates include unavailable nights.";
    }
    return null;
  }, [checkInD, checkOutD, blockedDates]);

  const nights =
    checkInD && checkOutD && checkOutD > checkInD ? nightsBetween(checkInD, checkOutD) : 0;

  const breakdown = useMemo(() => {
    if (!nights || dateError) return null;
    return computePriceBreakdown(
      nights,
      Number(property.base_price),
      Number(property.cleaning_fee ?? 0),
      rewardPct
    );
  }, [nights, dateError, property.base_price, property.cleaning_fee, rewardPct]);

  async function applyReward() {
    setRewardError(null);
    if (!rewardInput.trim()) {
      setRewardPct(0);
      return;
    }
    const res = await fetch("/api/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: rewardInput.trim(), property_id: property.id }),
    });
    const data = await res.json();
    if (!data.valid) {
      setRewardPct(0);
      setRewardError(data.error ?? "Invalid code");
      return;
    }
    setRewardPct(Number(data.discount_pct));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!breakdown || dateError) {
      setError(dateError ?? "Choose valid dates.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          check_in: checkIn,
          check_out: checkOut,
          guest_email: email.trim(),
          guest_phone: phone.trim() || undefined,
          guest_name: name.trim() || undefined,
          reward_code: rewardPct > 0 ? rewardInput.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Booking failed.");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
      }
    } finally {
      setLoading(false);
    }
  }

  const hero = property.images?.[0];

  return (
    <div className="mx-auto max-w-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      <div className="border-b border-[var(--color-border)] px-8 py-6">
        <h1 className="font-display text-2xl tracking-tight text-[var(--color-brand)]">
          {property.name}
        </h1>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Direct booking
        </p>
      </div>

      {hero ? (
        <div className="aspect-video w-full overflow-hidden bg-[var(--color-bg-subtle)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6 px-8 py-8">
        {property.description ? (
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {property.description}
          </p>
        ) : null}

        <ul className="flex flex-wrap gap-4 border-y border-[var(--color-border)] py-4 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          <li>No platform fees</li>
          <li>Secure checkout</li>
          <li>Instant confirmation</li>
        </ul>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            Check-in
            <input
              type="date"
              min={today}
              className="input mt-2"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            Check-out
            <input
              type="date"
              min={checkIn || today}
              className="input mt-2"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </label>
        </div>

        {dateError && (
          <p className="text-sm text-[var(--color-error)]">{dateError}</p>
        )}

        {breakdown && !dateError && (
          <div className="space-y-2 border-t border-[var(--color-border)] pt-6 text-sm">
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>
                {money(property.base_price)}/night × {breakdown.nights} nights
              </span>
              <span>{money(breakdown.baseNightlyTotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>Cleaning fee</span>
              <span>{money(breakdown.cleaningFee)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-brand-accent)]">
              <span>Direct booking discount ({breakdown.directDiscountPct}%)</span>
              <span>-{money(breakdown.directDiscountAmount)}</span>
            </div>
            {breakdown.rewardDiscountPct > 0 && (
              <div className="flex justify-between text-[var(--color-brand-accent)]">
                <span>Appreciation reward ({breakdown.rewardDiscountPct}%)</span>
                <span>-{money(breakdown.rewardDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--color-border)] pt-3 font-medium text-[var(--color-text-primary)]">
              <span>Total</span>
              <span>{money(breakdown.finalTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>vs. booking through Airbnb (est.)</span>
              <span>{money(breakdown.airbnbComparable)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-[var(--color-brand-accent)]">
              <span>You save (est.)</span>
              <span>{money(breakdown.savingsVsAirbnb)}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            Have a reward code?
          </p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={rewardInput}
              onChange={(e) => setRewardInput(e.target.value)}
              placeholder="STAY-XXXX"
            />
            <button type="button" className="btn-primary shrink-0 px-4" onClick={() => void applyReward()}>
              Apply
            </button>
          </div>
          {rewardError && <p className="text-xs text-[var(--color-error)]">{rewardError}</p>}
        </div>

        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Your email
          <input
            className="input mt-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Your phone (optional)
          <input
            className="input mt-2"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Name (optional)
          <input className="input mt-2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !breakdown || !!dateError}
          className="btn-accent w-full justify-center disabled:opacity-50"
        >
          {breakdown
            ? `Book direct — ${money(breakdown.finalTotal)}`
            : "Book direct and save 10%"}
        </button>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Secure payment via Stripe. No platform fees.
        </p>
      </form>
    </div>
  );
}
