import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";

export default async function PropertyBookingPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: property, error } = await supabase
    .from("properties")
    .select("id, name, slug, description, base_price, cleaning_fee, images")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error || !property) {
    notFound();
  }

  const { data: blocked } = await supabase
    .from("blocked_dates")
    .select("date")
    .eq("property_id", property.id);

  const blockedDates = (blocked ?? []).map((r) => r.date as string);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] py-16 text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-lg px-6">
        <BookingForm
          property={{
          ...property,
          base_price: Number(property.base_price),
          cleaning_fee: property.cleaning_fee != null ? Number(property.cleaning_fee) : 0,
          images: property.images ?? [],
        }}
          blockedDates={blockedDates}
        />
      </div>
    </div>
  );
}
