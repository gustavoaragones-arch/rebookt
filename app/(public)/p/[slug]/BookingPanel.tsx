"use client";

import { useMemo, useState } from "react";
import { PROTOTYPE_MODE } from "@/lib/config";
import { computeGuestBookingPrice } from "@/lib/booking-pricing";
import { formatYmd, nightsBetween } from "@/lib/booking-dates";
import { DatePicker } from "./DatePicker";

export type PropertyBooking = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  cleaning_fee: number;
  images: string[];
};

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

type Props = {
  property: PropertyBooking;
  blockedDates: string[];
};

export function BookingPanel({ property, blockedDates }: Props) {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [rewardCode, setRewardCode] = useState("");
  const [rewardDiscount, setRewardDiscount] = useState<number | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [rewardSuccess, setRewardSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  const nights =
    checkIn && checkOut ? Math.max(0, nightsBetween(checkIn, checkOut)) : 0;

  const price = useMemo(() => {
    if (!checkIn || !checkOut || nights < 1) return null;
    return computeGuestBookingPrice(
      nights,
      property.base_price,
      property.cleaning_fee,
      rewardDiscount ?? 0
    );
  }, [checkIn, checkOut, nights, property.base_price, property.cleaning_fee, rewardDiscount]);

  const datesComplete = Boolean(checkIn && checkOut && nights >= 1);

  const onRangeChange = (ci: Date | null, co: Date | null) => {
    setCheckIn(ci);
    setCheckOut(co);
    setDateRangeError(null);
    setError(null);
    if (!ci || !co) {
      setRewardDiscount(null);
      setRewardCode("");
      setRewardError(null);
      setRewardSuccess(false);
    }
  };

  const applyReward = async () => {
    setRewardError(null);
    setRewardSuccess(false);
    const code = rewardCode.trim();
    if (!code) {
      setRewardError("Enter a code.");
      return;
    }
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, property_id: property.id }),
      });
      const data = (await res.json()) as { valid?: boolean; discount_pct?: number; error?: string };
      if (!res.ok) {
        setRewardDiscount(null);
        setRewardError(data.error ?? "Could not apply code.");
        return;
      }
      if (data.valid && typeof data.discount_pct === "number") {
        setRewardDiscount(data.discount_pct);
        setRewardSuccess(true);
      }
    } catch {
      setRewardDiscount(null);
      setRewardError("Could not apply code.");
    }
  };

  const submit = async () => {
    setError(null);
    if (!checkIn || !checkOut || nights < 1) {
      setError("Select check-in and check-out dates.");
      return;
    }
    if (!guestName.trim() || !guestEmail.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          check_in: formatYmd(checkIn),
          check_out: formatYmd(checkOut),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim() || undefined,
          guest_name: guestName.trim(),
          reward_code: rewardDiscount != null && rewardCode.trim() ? rewardCode.trim() : undefined,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        success?: boolean;
        booking_id?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (PROTOTYPE_MODE && data.success && data.booking_id) {
        window.location.href = `/success?booking_id=${data.booking_id}`;
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Booking failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLabel = price ? money(price.total) : "—";

  return (
    <div className="w-full max-w-[420px] font-sans lg:sticky lg:top-[24px] lg:max-w-[420px]">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
        <p className="font-display text-2xl text-[var(--color-text-primary)]">
          {money(property.base_price)}{" "}
          <span className="font-sans text-[15px] font-normal text-[var(--color-text-secondary)]">
            / night
          </span>
        </p>

        <div className="mt-6">
          <DatePicker
            blockedDates={blockedDates}
            checkIn={checkIn}
            checkOut={checkOut}
            onRangeChange={onRangeChange}
            onBlockedRangeAttempt={() =>
              setDateRangeError("Those dates include unavailable nights.")
            }
          />
          {dateRangeError ? (
            <p className="mt-3 text-[13px] text-[var(--color-error)]">{dateRangeError}</p>
          ) : null}
        </div>

        {datesComplete && price ? (
          <div className="mt-8 space-y-3 border-t border-[var(--color-border)] pt-6 text-[14px] text-[var(--color-text-secondary)]">
            <div className="flex justify-between gap-4">
              <span>
                {price.nights} nights × {money(property.base_price)}
              </span>
              <span className="font-mono text-[var(--color-text-primary)]">{money(price.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Direct booking discount (10%)</span>
              <span className="font-mono text-[var(--color-text-primary)]">
                −{money(price.directDiscount)}
              </span>
            </div>
            <div className="border-t border-[var(--color-border)] pt-3" />
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <span className="font-mono text-[var(--color-text-primary)]">
                {money(price.afterDirectDiscount)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Cleaning fee</span>
              <span className="font-mono text-[var(--color-text-primary)]">
                {money(property.cleaning_fee)}
              </span>
            </div>
            {rewardDiscount != null && rewardDiscount > 0 ? (
              <div className="flex justify-between gap-4">
                <span>Reward ({rewardDiscount}% off)</span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  −{money(price.rewardDiscountAmount)}
                </span>
              </div>
            ) : null}
            <div className="border-t border-[var(--color-border)] pt-3" />
            <div className="flex justify-between gap-4 font-medium text-[var(--color-text-primary)]">
              <span>Total</span>
              <span className="font-mono">{money(price.total)}</span>
            </div>
            <p className="pt-2 text-[13px] font-medium text-[var(--color-brand-accent)]">
              vs. booking through Airbnb: {money(price.airbnbPrice)}{" "}
              <span className="whitespace-nowrap">You save: {money(price.totalSavings)}</span>
            </p>
          </div>
        ) : null}

        {datesComplete ? (
          <div className="mt-8 space-y-4 border-t border-[var(--color-border)] pt-6">
            <div>
              <p className="mb-2 text-[13px] text-[var(--color-text-muted)]">Have a reward code?</p>
              <div className="flex gap-2">
                <input
                  className="input min-w-0 flex-1"
                  value={rewardCode}
                  onChange={(e) => {
                    setRewardCode(e.target.value);
                    setRewardError(null);
                    setRewardSuccess(false);
                    setRewardDiscount(null);
                  }}
                  placeholder="Code"
                  autoComplete="off"
                />
                <button type="button" className="btn-primary shrink-0 px-4" onClick={applyReward}>
                  Apply
                </button>
              </div>
              {rewardError ? (
                <p className="mt-2 text-[13px] text-[var(--color-error)]">{rewardError}</p>
              ) : null}
              {rewardSuccess && rewardDiscount != null ? (
                <p className="mt-2 text-[13px] font-medium text-[var(--color-brand-accent)]">
                  Reward applied — {rewardDiscount}% off your stay
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-[13px] text-[var(--color-text-secondary)]">
                Full name <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                className="input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[var(--color-text-secondary)]">
                Email <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                className="input"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[var(--color-text-secondary)]">
                Mobile — for booking updates
              </label>
              <input
                className="input"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
        ) : null}

        {datesComplete ? (
          <div className="mt-8">
            <button
              type="button"
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={submit}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  <span>{PROTOTYPE_MODE ? "Sending request…" : "Redirecting…"}</span>
                </>
              ) : (
                <span>
                  {PROTOTYPE_MODE ? "Request Booking" : "Book Direct"} — {totalLabel}
                </span>
              )}
            </button>
            {error ? <p className="mt-3 text-center text-[13px] text-[var(--color-error)]">{error}</p> : null}
          </div>
        ) : null}

        <TrustBadges />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function TrustBadges() {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-text-muted)] sm:flex-row sm:flex-wrap sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2">
        <LockIcon />
        <span>Secure payment via Stripe</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckIcon />
        <span>No platform fees</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckIcon />
        <span>Instant confirmation</span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--color-text-muted)]" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0110 0v3M6 11h12v10H6V11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--color-text-muted)]" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
