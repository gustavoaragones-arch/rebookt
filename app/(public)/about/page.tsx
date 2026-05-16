import Link from "next/link";
import { SiteFooter } from "../_components/site-footer";

export const metadata = {
  title: "About — Rebookt",
  description: "What Rebookt is and who it is for.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-xl text-[var(--color-brand)]">
            Rebookt
          </Link>
          <Link href="/login" className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)] hover:underline">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl text-[var(--color-brand)]">About Rebookt</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            Rebookt helps short-term rental hosts turn past guests into repeat direct bookings. We focus on guest
            capture, automated follow-up after checkout, a clean direct booking page, and optional guest appreciation
            rewards — without building a full PMS or replacing Airbnb.
          </p>
          <p>
            The product is designed to sit alongside your existing channels, respect platform rules, and keep messaging
            policy-safe (for example, rewards are framed as host appreciation, not payment for reviews).
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Rebookt is offered as-is; see our Terms and Privacy Policy for limitations and data practices.
          </p>
        </div>
        <p className="mt-10">
          <Link href="/" className="text-sm text-[var(--color-brand-light)] underline underline-offset-4">
            ← Back to home
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
