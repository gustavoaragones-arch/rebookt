import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/dashboard/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="font-display text-xl tracking-tight">
            Rebookt
          </Link>
          <nav className="flex items-center gap-8 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            <Link href="/dashboard" className="hover:text-[var(--color-text-primary)]">
              Overview
            </Link>
            <Link href="/dashboard/properties" className="hover:text-[var(--color-text-primary)]">
              Properties
            </Link>
            <Link href="/dashboard/bookings" className="hover:text-[var(--color-text-primary)]">
              Bookings
            </Link>
            <Link href="/dashboard/guests" className="hover:text-[var(--color-text-primary)]">
              Guests
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="hover:text-[var(--color-text-primary)]"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
