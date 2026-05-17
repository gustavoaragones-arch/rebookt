import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { addBlockedDateAction, removeBlockedDateAction } from "./actions";
import { GarSettingsPanel } from "./GarSettingsPanel";

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !property) notFound();

  const { data: hostProfile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: blocked } = await supabase
    .from("blocked_dates")
    .select("id, date, reason")
    .eq("property_id", property.id)
    .order("date", { ascending: true });

  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const snippet = `<script src="${appUrl}/widget.js" data-property="${property.slug}"></script>`;

  return (
    <div className="space-y-12">
      <Link href="/dashboard/properties" className="text-sm text-[var(--color-text-secondary)] hover:underline">
        ← Properties
      </Link>
      <div>
        <h1 className="font-display text-3xl text-[var(--color-brand)]">{property.name}</h1>
        <p className="mt-2 font-mono text-sm text-[var(--color-text-secondary)]">/{property.slug}</p>
        <a
          href={`/p/${property.slug}`}
          className="mt-4 inline-block text-sm text-[var(--color-brand-light)] underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          View booking page
        </a>
      </div>

      <section className="card max-w-xl">
        <h2 className="font-display text-xl text-[var(--color-brand)]">Widget embed</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Paste this snippet near the end of your page HTML, before the closing body tag.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 font-mono text-xs">
          {snippet}
        </pre>
      </section>

      <GarSettingsPanel
        property={{
          id: property.id,
          gar_enabled: property.gar_enabled === true,
          gar_discount_pct: Number(property.gar_discount_pct ?? 5),
          gar_trigger_delay_days: Number(property.gar_trigger_delay_days ?? 5),
          gar_google_business_url: property.gar_google_business_url,
        }}
        hostFullName={(hostProfile?.full_name as string | null) ?? null}
      />

      <section className="card max-w-xl">
        <h2 className="font-display text-xl text-[var(--color-brand)]">Blocked dates</h2>
        <form action={addBlockedDateAction} className="mt-6 flex flex-wrap items-end gap-4">
          <input type="hidden" name="property_id" value={property.id} />
          <label className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            Date
            <input className="input mt-2" type="date" name="date" required />
          </label>
          <button type="submit" className="btn-primary">
            Block date
          </button>
        </form>
        <ul className="mt-6 divide-y divide-[var(--color-border)] text-sm">
          {(blocked ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between py-3">
              <span>{b.date as string}</span>
              <form action={removeBlockedDateAction}>
                <input type="hidden" name="property_id" value={property.id} />
                <input type="hidden" name="blocked_id" value={b.id} />
                <button type="submit" className="text-xs uppercase tracking-[0.08em] text-[var(--color-error)]">
                  Remove
                </button>
              </form>
            </li>
          ))}
          {(!blocked || blocked.length === 0) && (
            <li className="py-4 text-[var(--color-text-muted)]">No blocked dates.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
