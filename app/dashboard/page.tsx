import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: properties } = await supabase
    .from("properties")
    .select("id")
    .eq("user_id", user.id);

  const ids = (properties ?? []).map((p) => p.id);
  let bookingCount = 0;
  if (ids.length) {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("property_id", ids);
    bookingCount = count ?? 0;
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--color-brand)]">Overview</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Welcome back. This dashboard stays focused on conversion — no charts in Phase 1.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Properties
          </p>
          <p className="mt-3 font-display text-3xl text-[var(--color-brand)]">{properties?.length ?? 0}</p>
          <Link href="/dashboard/properties" className="mt-4 inline-block text-sm text-[var(--color-brand-light)] underline">
            Manage
          </Link>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Bookings
          </p>
          <p className="mt-3 font-display text-3xl text-[var(--color-brand)]">{bookingCount}</p>
          <Link href="/dashboard/bookings" className="mt-4 inline-block text-sm text-[var(--color-brand-light)] underline">
            View all
          </Link>
        </div>
      </div>
    </div>
  );
}
