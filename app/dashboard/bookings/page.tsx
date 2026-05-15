import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: props } = await supabase.from("properties").select("id").eq("user_id", user.id);
  const ids = (props ?? []).map((p) => p.id);
  if (!ids.length) {
    return (
      <div>
        <h1 className="font-display text-3xl text-[var(--color-brand)]">Bookings</h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Create a property to see bookings.</p>
        <Link href="/dashboard/properties/new" className="btn-primary mt-6 inline-flex">
          New property
        </Link>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("bookings")
    .select("id, guest_name, guest_email, check_in, check_out, total_price, status, properties(name)")
    .in("property_id", ids)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--color-brand)]">Bookings</h1>
      <div className="mt-10 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-4">Guest</th>
              <th className="px-6 py-4">Property</th>
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((b) => {
              const prop = b.properties as unknown;
              const pname = Array.isArray(prop)
                ? (prop[0] as { name?: string } | undefined)?.name
                : (prop as { name?: string } | null)?.name;
              const label = (b.guest_name as string) || (b.guest_email as string);
              return (
                <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-6 py-4">{label}</td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{pname ?? "—"}</td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                    {b.check_in} → {b.check_out}
                  </td>
                  <td className="px-6 py-4">${Number(b.total_price).toFixed(0)}</td>
                  <td className="px-6 py-4 text-xs uppercase tracking-[0.08em]">{b.status}</td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-[var(--color-text-muted)]">
                  No bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
