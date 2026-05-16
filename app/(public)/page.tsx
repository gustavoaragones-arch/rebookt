import Image from "next/image";
import Link from "next/link";
import { RoiCalculator } from "./_components/roi-calculator";
import { SiteFooter } from "./_components/site-footer";
import { WidgetDemo } from "./_components/widget-demo";
import { WidgetEmbedSnippet } from "./_components/widget-embed-snippet";
import { env } from "@/lib/env";

const heroImage =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80";

export default function LandingPage() {
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-xl tracking-tight text-[var(--color-brand)]">Rebookt</span>
          <nav className="flex items-center gap-8 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            <a href="#how" className="hover:text-[var(--color-text-primary)]">
              How it works
            </a>
            <a href="#pricing" className="hover:text-[var(--color-text-primary)]">
              Pricing
            </a>
            <Link href="/about" className="hover:text-[var(--color-text-primary)]">
              About
            </Link>
            <Link href="/login" className="hover:text-[var(--color-text-primary)]">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-[var(--color-brand)] sm:text-5xl lg:text-[56px]">
            Stop Paying Airbnb 15% on Repeat Guests
          </h1>
          <p className="mt-6 text-lg text-[var(--color-text-secondary)] sm:text-xl">
            Turn every stay into future direct revenue — automatically.
          </p>
          <Link href="/login" className="btn-accent mt-10 inline-flex">
            Get your direct booking setup
          </Link>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Works alongside Airbnb — no impact on rankings
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-border)]">
          <Image src={heroImage} alt="Luxury interior" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" priority />
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Airbnb charges 3–15% per booking",
                body: "Fees compound on every reservation you run through the platform.",
              },
              {
                title: "A $100K property loses $10–15K/year",
                body: "Repeat guests are the fastest margin you are leaving on the table.",
              },
              {
                title: "Your guests trust you — not the platform",
                body: "The relationship is yours. The checkout should be too.",
              },
            ].map((c) => (
              <div key={c.title} className="card">
                <h3 className="font-display text-xl text-[var(--color-brand)]">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-12 max-w-2xl text-center text-lg text-[var(--color-text-secondary)]">
            You already did the hard part. We make sure you keep the margin the second time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Capture",
              body: "We store guest contact details after every stay.",
            },
            {
              title: "Automate",
              body: "Follow-up emails go out automatically after checkout.",
            },
            {
              title: "Convert",
              body: "Guests book on your direct page. You keep the commission.",
            },
          ].map((c) => (
            <div key={c.title} className="border-t border-[var(--color-border-strong)] pt-8">
              <h3 className="font-display text-2xl text-[var(--color-brand)]">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-3xl text-[var(--color-brand)]">How it works</h2>
          <ol className="mt-12 space-y-10 border-l border-[var(--color-border-strong)] pl-8">
            <li>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Step 1
              </p>
              <p className="mt-2 font-display text-xl text-[var(--color-brand)]">Guest stays via Airbnb as normal</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">No changes to your existing setup.</p>
            </li>
            <li>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Step 2
              </p>
              <p className="mt-2 font-display text-xl text-[var(--color-brand)]">We follow up automatically</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Email with a direct booking link after checkout.
              </p>
            </li>
            <li>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Step 3
              </p>
              <p className="mt-2 font-display text-xl text-[var(--color-brand)]">They book direct next time</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                You save the platform fee — every time.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <RoiCalculator />
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] py-24">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-3xl text-[var(--color-brand)]">Widget demo</h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Paste one line of code into your website. The widget does the rest.
            </p>
            <WidgetEmbedSnippet appUrl={appUrl} />
          </div>
          <WidgetDemo />
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-md card text-center">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Pricing</p>
          <p className="mt-4 font-display text-4xl text-[var(--color-brand)]">$49 / month</p>
          <ul className="mt-8 space-y-3 text-left text-sm text-[var(--color-text-secondary)]">
            <li>Direct booking page for your property</li>
            <li>Automated guest follow-up (email)</li>
            <li>Embeddable booking widget</li>
            <li>Guest contact database</li>
            <li>Stripe-powered payments</li>
            <li>Guest appreciation rewards — automated</li>
          </ul>
          <Link href="/login" className="btn-accent mt-10 w-full justify-center">
            Start for free — 14-day trial
          </Link>
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            No commission. No setup fee. Cancel anytime.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl text-[var(--color-brand)]">
            Your next guest is already in Airbnb. Make sure the one after is yours.
          </h2>
          <Link href="/login" className="btn-primary mt-10 inline-flex">
            Start recovering your bookings
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
