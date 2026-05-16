import Link from "next/link";
import { SiteFooter } from "../_components/site-footer";

export const metadata = {
  title: "Terms of Service — Rebookt",
  description: "Terms governing use of the Rebookt service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-xl text-[var(--color-brand)]">
            Rebookt
          </Link>
          <Link
            href="/login"
            className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs text-[var(--color-text-muted)]">Effective May 15, 2026 · United States</p>
        <h1 className="mt-2 font-display text-3xl text-[var(--color-brand)]">Terms of Service</h1>
        <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
          These Terms are provided as standard operational railguards for a SaaS product. They are not a substitute for
          advice from a licensed attorney. Review periodically with qualified counsel as your business grows.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">1. Acceptance</h2>
            <p className="mt-3">
              By accessing or using Rebookt (&quot;Service&quot;), you agree to these Terms. If you do not agree, do
              not use the Service.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">2. The Service</h2>
            <p className="mt-3">
              Rebookt provides tools for vacation-rental hosts, including direct booking pages, guest messaging
              automation, optional guest appreciation rewards, dashboards, and related integrations (such as payment
              processing via Stripe). Features may change; we may suspend or discontinue parts of the Service with
              reasonable notice where practicable.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">3. Accounts</h2>
            <p className="mt-3">
              You are responsible for safeguarding your account credentials and for activity under your account. Notify
              us promptly at{" "}
              <a href="mailto:hello@rebookt.com" className="text-[var(--color-brand-light)] underline">
                hello@rebookt.com
              </a>{" "}
              of suspected unauthorized use.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">4. Acceptable use</h2>
            <p className="mt-3">
              You will not use the Service to violate law, send deceptive or abusive communications, scrape our
              systems without permission, attempt unauthorized access, or misuse personal data obtained through the
              Service. You remain responsible for compliance with Airbnb, Google, email/SMS rules, and other platforms
              you use alongside Rebookt.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">5. Fees and billing</h2>
            <p className="mt-3">
              Paid plans are billed as disclosed at checkout. Unless stated otherwise, fees are in U.S. dollars,
              non-refundable except where required by law, and may change with reasonable notice. Payment processing is
              subject to Stripe&apos;s terms.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">6. Third-party services</h2>
            <p className="mt-3">
              The Service may rely on vendors (e.g. Supabase, Stripe, Resend). Their terms and privacy policies apply
              to their handling of data and infrastructure. We are not responsible for third-party outages or
              practices beyond our reasonable control.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">7. Intellectual property</h2>
            <p className="mt-3">
              Rebookt and its branding, software, and content are protected by applicable IP laws. We grant you a
              limited, non-exclusive, non-transferable license to use the Service during your subscription in line with
              these Terms.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">8. Disclaimers</h2>
            <p className="mt-3">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">9. Limitation of liability</h2>
            <p className="mt-3">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, REBOOKT AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, OR FOR LOSS OF PROFITS, GOODWILL, OR DATA. OUR
              AGGREGATE LIABILITY FOR CLAIMS ARISING OUT OF THE SERVICE IN ANY TWELVE-MONTH PERIOD WILL NOT EXCEED THE
              AMOUNTS YOU PAID US FOR THE SERVICE IN THAT PERIOD (OR USD $50 IF GREATER).
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">10. Termination</h2>
            <p className="mt-3">
              You may stop using the Service at any time. We may suspend or terminate access for breach of these Terms
              or risk to the Service or other users.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">11. Governing law</h2>
            <p className="mt-3">
              These Terms are governed by the laws of the United States and the State of Delaware, excluding conflict
              of law rules. Courts in Delaware have exclusive jurisdiction, subject to mandatory consumer protections
              where you reside.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">12. Contact</h2>
            <p className="mt-3">
              Questions about these Terms:{" "}
              <a href="mailto:hello@rebookt.com" className="text-[var(--color-brand-light)] underline">
                hello@rebookt.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-12">
          <Link href="/" className="text-sm text-[var(--color-brand-light)] underline underline-offset-4">
            ← Back to home
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
