import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GuestDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: guest, error } = await supabase
    .from("guests")
    .select("id, email, phone, first_name, last_name, last_stay_date, property_id, properties(name, user_id)")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !guest) notFound();

  const prop = guest.properties as unknown;
  const ownerId = Array.isArray(prop)
    ? (prop[0] as { user_id?: string } | undefined)?.user_id
    : (prop as { user_id?: string } | null)?.user_id;

  if (ownerId !== user.id) notFound();

  const pname = Array.isArray(prop)
    ? (prop[0] as { name?: string } | undefined)?.name
    : (prop as { name?: string } | null)?.name;

  const { data: rewards } = await supabase
    .from("reward_codes")
    .select("id, code, status, sent_at, redeemed_at, expires_at, discount_pct")
    .eq("guest_id", guest.id)
    .order("created_at", { ascending: false });

  const { data: msgs } = await supabase
    .from("messages")
    .select("template, type, status, sent_at, created_at")
    .eq("guest_id", guest.id)
    .order("created_at", { ascending: false });

  const gar = (msgs ?? []).find((m) => m.template === "gar_invite");

  return (
    <div className="space-y-8">
      <Link href="/dashboard/guests" className="text-sm text-[var(--color-text-secondary)] hover:underline">
        ← Guests
      </Link>
      <div>
        <h1 className="font-display text-3xl text-[var(--color-brand)]">
          {(guest.first_name as string) || (guest.email as string)}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {guest.email as string} · {pname ?? "Property"}
        </p>
      </div>

      <section className="card max-w-xl">
        <h2 className="font-display text-xl text-[var(--color-brand)]">Reward codes</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(rewards ?? []).length === 0 && (
            <li className="text-[var(--color-text-muted)]">No reward codes yet.</li>
          )}
          {(rewards ?? []).map((r) => (
            <li key={r.id as string} className="border-b border-[var(--color-border)] pb-3 last:border-0">
              <span className="font-mono text-xs">{r.code as string}</span>
              <span className="ml-3 text-[var(--color-text-secondary)]">
                {r.status as string} · {Number(r.discount_pct)}% off
              </span>
              {r.sent_at && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Sent {new Date(r.sent_at as string).toLocaleString()}
                </p>
              )}
              {r.redeemed_at && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Redeemed {new Date(r.redeemed_at as string).toLocaleString()}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card max-w-xl">
        <h2 className="font-display text-xl text-[var(--color-brand)]">GAR message</h2>
        {gar?.sent_at ? (
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
            Sent {new Date(gar.sent_at as string).toLocaleString()} ({gar.type as string})
          </p>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">No GAR message recorded for this guest.</p>
        )}
      </section>

      <section className="card max-w-xl">
        <h2 className="font-display text-xl text-[var(--color-brand)]">Message history</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
          {(msgs ?? []).map((m, i) => (
            <li key={i}>
              {(m.template as string) || "—"} · {(m.status as string) || "—"}
              {m.sent_at ? ` · ${new Date(m.sent_at as string).toLocaleString()}` : ""}
            </li>
          ))}
          {(!msgs || msgs.length === 0) && <li className="text-[var(--color-text-muted)]">No messages.</li>}
        </ul>
      </section>
    </div>
  );
}
