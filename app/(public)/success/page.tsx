import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatGuestDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SuccessCheck() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto" aria-hidden>
      <circle cx="20" cy="20" r="18" stroke="var(--color-brand-accent)" strokeWidth="2" fill="none" />
      <path
        d="M12 20l6 6 10-12"
        stroke="var(--color-brand-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; booking_id?: string };
}) {
  const sessionId = searchParams.session_id ?? null;
  const bookingId = searchParams.booking_id ?? null;

  let guestEmail: string | null = null;
  let bookingStatus: string | null = null;
  let propertyName: string | null = null;
  let propertySlug: string | null = null;
  let checkIn: string | null = null;
  let checkOut: string | null = null;
  let total: number | null = null;

  if (sessionId || bookingId) {
    const admin = createAdminClient();
    const base = admin
      .from("bookings")
      .select("guest_email, check_in, check_out, total_price, property_id, status");
    const filtered = sessionId
      ? base.eq("stripe_session_id", sessionId)
      : base.eq("id", bookingId as string);
    const { data: booking } = await filtered.maybeSingle();

    if (booking) {
      guestEmail = booking.guest_email as string;
      bookingStatus = booking.status as string;
      checkIn = booking.check_in as string;
      checkOut = booking.check_out as string;
      total = Number(booking.total_price);

      const { data: prop } = await admin
        .from("properties")
        .select("name, slug")
        .eq("id", booking.property_id as string)
        .maybeSingle();
      if (prop) {
        propertyName = prop.name as string;
        propertySlug = prop.slug as string;
      }
    }
  }

  const hasSummary = Boolean(
    guestEmail && propertyName && checkIn && checkOut && total != null && propertySlug
  );

  const isRequested = bookingStatus === "requested";
  const headline = isRequested ? "Booking request sent." : "You're booked.";
  const subtext = isRequested
    ? guestEmail
      ? `The host will confirm your dates and reach out within 24 hours. A summary has been sent to ${guestEmail}.`
      : "The host will confirm your dates and reach out within 24 hours."
    : guestEmail
      ? `A confirmation has been sent to ${guestEmail}.`
      : "Thank you for booking direct. If you completed checkout, a confirmation email is on the way.";

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)] px-4 py-16 text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-[520px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-8 py-12 sm:px-12 sm:py-12">
        <SuccessCheck />
        <h1 className="mt-8 text-center font-display text-[36px] leading-tight text-[var(--color-text-primary)]">
          {headline}
        </h1>
        <p className="mt-6 text-center font-sans text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {subtext}
        </p>

        {hasSummary && guestEmail && propertyName && checkIn && checkOut && total != null && propertySlug ? (
          <div className="mt-10 space-y-3 font-sans text-[15px] text-[var(--color-text-secondary)]">
            <p className="text-center font-display text-xl text-[var(--color-text-primary)]">{propertyName}</p>
            <div className="flex justify-between gap-4">
              <span>Check-in</span>
              <span className="text-right text-[var(--color-text-primary)]">{formatGuestDate(checkIn)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Check-out</span>
              <span className="text-right text-[var(--color-text-primary)]">{formatGuestDate(checkOut)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Total</span>
              <span className="font-mono text-[var(--color-text-primary)]">{money(total)}</span>
            </div>
          </div>
        ) : null}

        <div className="my-10 h-px bg-[var(--color-border)]" />

        <p className="text-center font-sans text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          Next time, book direct and save even more.
        </p>

        {propertySlug ? (
          <div className="mt-10 flex justify-center">
            <Link
              href={`/p/${propertySlug}`}
              className="inline-flex items-center justify-center rounded border border-[var(--color-border-strong)] bg-transparent px-8 py-3 font-sans text-[15px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-subtle)]"
            >
              Return to property
            </Link>
          </div>
        ) : (
          <div className="mt-10 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded border border-[var(--color-border-strong)] bg-transparent px-8 py-3 font-sans text-[15px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-subtle)]"
            >
              Return home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
