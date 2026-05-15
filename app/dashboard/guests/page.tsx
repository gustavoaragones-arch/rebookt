import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GuestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: props } = await supabase.from("properties").select("id, name").eq("user_id", user.id);
  const ids = (props ?? []).map((p) => p.id);
  if (!ids.length) {
    return (
      <div>
        <h1 className="font-display text-3xl text-[var(--color-brand)]">Guests</h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Create a property to track guests.</p>
      </div>
    );
  }

  const { data: guests } = await supabase
    .from("guests")
    .select("id, email, phone, last_stay_date, property_id, properties(name)")
    .in("property_id", ids)
    .order("last_stay_date", { ascending: false });

  const guestIds = (guests ?? []).map((g) => g.id);
  const rewardByGuest = new Map<string, { code: string; status: string }>();
  const garSentByGuest = new Map<string, string>();

  if (guestIds.length) {
    const { data: rewards } = await supabase
      .from("reward_codes")
      .select("guest_id, code, status, created_at")
      .in("guest_id", guestIds)
      .order("created_at", { ascending: false });

    for (const r of rewards ?? []) {
      const gid = r.guest_id as string;
      if (!rewardByGuest.has(gid)) {
        rewardByGuest.set(gid, { code: r.code as string, status: r.status as string });
      }
    }

    const { data: garMsgs } = await supabase
      .from("messages")
      .select("guest_id, sent_at")
      .eq("template", "gar_invite")
      .in("guest_id", guestIds)
      .order("sent_at", { ascending: false });

    for (const m of garMsgs ?? []) {
      const gid = m.guest_id as string;
      if (!garSentByGuest.has(gid) && m.sent_at) {
        garSentByGuest.set(gid, m.sent_at as string);
      }
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--color-brand)]">Guests</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Captured from direct bookings. CSV import from Airbnb is Phase 2.
      </p>
      <div className="mt-10 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Property</th>
              <th className="px-6 py-4">Last stay</th>
              <th className="px-6 py-4">Reward</th>
              <th className="px-6 py-4">GAR sent</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {(guests ?? []).map((g) => {
              const prop = g.properties as unknown;
              const pname = Array.isArray(prop)
                ? (prop[0] as { name?: string } | undefined)?.name
                : (prop as { name?: string } | null)?.name;
              const rw = rewardByGuest.get(g.id as string);
              const gar = garSentByGuest.get(g.id as string);
              return (
                <tr key={g.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-6 py-4">{g.email as string}</td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{(g.phone as string) || "—"}</td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{pname ?? "—"}</td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                    {(g.last_stay_date as string) ?? "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-secondary)]">
                    {rw ? `${rw.code} (${rw.status})` : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)]">
                    {gar ? new Date(gar).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/guests/${g.id}`}
                      className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-brand-light)] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!guests || guests.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-[var(--color-text-muted)]">
                  No guests yet. They appear after confirmed bookings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
