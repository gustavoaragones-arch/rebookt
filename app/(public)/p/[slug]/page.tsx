import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingPanel, type PropertyBooking } from "./BookingPanel";
import { PropertyGallery } from "./PropertyGallery";

function PropertyBookingNav() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-xl font-semibold text-[var(--color-brand)]">
          Rebookt
        </Link>
        <span className="font-sans text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Powered by Rebookt
        </span>
      </div>
    </header>
  );
}

function BookingPanelSkeleton() {
  return (
    <div
      className="w-full max-w-[420px] animate-pulse lg:sticky lg:top-[24px]"
      aria-hidden
    >
      <div className="min-h-[520px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="h-8 w-36 rounded bg-[var(--color-bg-subtle)]" />
        <div className="mt-8 h-64 rounded bg-[var(--color-bg-subtle)]" />
        <div className="mt-6 h-24 rounded bg-[var(--color-bg-subtle)]" />
        <div className="mt-8 h-12 w-full rounded bg-[var(--color-bg-subtle)]" />
      </div>
    </div>
  );
}

function PropertyBookingFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <PropertyBookingNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr),minmax(0,420px)] lg:items-start lg:gap-12 lg:px-8 lg:py-10">
        <div className="lg:sticky lg:top-[24px] lg:self-start">
          <div className="aspect-[4/3] w-full animate-pulse bg-[var(--color-bg-subtle)] lg:rounded-lg" />
          <div className="mt-6 h-8 w-2/3 max-w-sm rounded bg-[var(--color-bg-subtle)]" />
          <div className="mt-3 h-4 w-32 rounded bg-[var(--color-bg-subtle)]" />
          <div className="mt-6 space-y-2">
            <div className="h-3 w-full rounded bg-[var(--color-bg-subtle)]" />
            <div className="h-3 w-full rounded bg-[var(--color-bg-subtle)]" />
            <div className="h-3 w-4/5 rounded bg-[var(--color-bg-subtle)]" />
          </div>
        </div>
        <div className="mt-10 lg:mt-0">
          <BookingPanelSkeleton />
        </div>
      </main>
    </div>
  );
}

async function PropertyBookingContent({ slug }: { slug: string }) {
  const supabase = await createClient();
  const { data: property, error } = await supabase
    .from("properties")
    .select("id, name, slug, description, base_price, cleaning_fee, images, location")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !property) {
    notFound();
  }

  const { data: blocked } = await supabase
    .from("blocked_dates")
    .select("date")
    .eq("property_id", property.id);

  const blockedDates = (blocked ?? []).map((r) => r.date as string);

  const bookingProperty: PropertyBooking = {
    id: property.id,
    name: property.name,
    slug: property.slug,
    description: property.description,
    base_price: Number(property.base_price),
    cleaning_fee: property.cleaning_fee != null ? Number(property.cleaning_fee) : 0,
    images: property.images ?? [],
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <PropertyBookingNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr),minmax(0,420px)] lg:items-start lg:gap-12 lg:px-8 lg:py-10">
        <div className="lg:sticky lg:top-[24px] lg:self-start">
          <PropertyGallery images={bookingProperty.images} propertyName={bookingProperty.name} />
          <h1 className="mt-8 font-display text-[28px] leading-tight text-[var(--color-text-primary)]">
            {bookingProperty.name}
          </h1>
          <p className="mt-3 font-sans text-[13px] font-normal uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            {(property.location as string | null) ?? bookingProperty.slug}
          </p>
          {bookingProperty.description ? (
            <p className="mt-6 font-sans text-[15px] leading-[1.7] text-[var(--color-text-secondary)]">
              {bookingProperty.description}
            </p>
          ) : null}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-center font-sans text-[13px] text-[var(--color-text-secondary)]">
              Base rate:{" "}
              <span className="text-[var(--color-text-primary)]">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                  bookingProperty.base_price
                )}{" "}
                / night
              </span>
            </div>
            <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-center font-sans text-[13px] text-[var(--color-text-secondary)]">
              Cleaning fee:{" "}
              <span className="text-[var(--color-text-primary)]">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                  bookingProperty.cleaning_fee
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-10 min-h-[520px] w-full lg:mt-0">
          <BookingPanel property={bookingProperty} blockedDates={blockedDates} />
        </div>
      </main>
    </div>
  );
}

export default function PropertyBookingPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<PropertyBookingFallback />}>
      <PropertyBookingContent slug={params.slug} />
    </Suspense>
  );
}
