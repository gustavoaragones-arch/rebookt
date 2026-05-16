import Link from "next/link";
import { SiteFooter } from "../_components/site-footer";

export const metadata = {
  title: "Privacy Policy — Rebookt",
  description: "How Rebookt collects, uses, and shares information.",
};

export default function PrivacyPage() {
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
        <h1 className="mt-2 font-display text-3xl text-[var(--color-brand)]">Privacy Policy</h1>
        <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
          This Policy describes how Rebookt (&quot;we,&quot; &quot;us&quot;) handles information when you use our
          websites and services. It is intended as operational documentation, not legal advice. Consult counsel for
          jurisdiction-specific obligations.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">1. What we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-[var(--color-text-primary)]">Account data:</strong> email and authentication
                identifiers from our auth provider.
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)]">Host &amp; property data:</strong> listings you
                configure (names, slugs, prices, images, availability blocks, reward settings).
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)]">Guest &amp; booking data:</strong> contact and
                stay details submitted on booking flows, payment metadata from Stripe, and message logs needed to run
                automation.
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)]">Technical data:</strong> server logs, device and
                browser signals, and diagnostics to secure and improve the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">2. How we use information</h2>
            <p className="mt-3">
              We use data to provide and secure the Service, process payments, send transactional and product emails,
              operate automation you configure, comply with law, and improve reliability. We do not sell your personal
              information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">3. Legal bases (EEA/UK visitors)</h2>
            <p className="mt-3">
              Where GDPR-style rules apply, we rely on contract (providing the Service), legitimate interests (fraud
              prevention, security, product improvement balanced against your rights), and consent where required (e.g.
              certain cookies or marketing, if offered).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">4. Sharing and processors</h2>
            <p className="mt-3">
              We use subprocessors such as Supabase (database/auth), Stripe (payments), Resend (email), and hosting on
              Vercel. They process data under agreements fit for their roles. We may disclose information if required by
              law or to protect rights and safety.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">5. Retention</h2>
            <p className="mt-3">
              We retain information as long as needed to provide the Service and meet legal, tax, and accounting
              obligations. You may request deletion of host account data subject to exceptions (e.g. completed payment
              records we must retain briefly).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">6. Your rights</h2>
            <p className="mt-3">
              Depending on your location, you may have rights to access, correct, delete, or export personal data, and
              to object to or restrict certain processing. Contact{" "}
              <a href="mailto:hello@rebookt.com" className="text-[var(--color-brand-light)] underline">
                hello@rebookt.com
              </a>{" "}
              to exercise rights. You may lodge a complaint with your local supervisory authority.
            </p>
          </section>

          <section id="cookies">
            <h2 className="font-display text-xl text-[var(--color-brand)]">7. Cookies and similar technologies</h2>
            <p className="mt-3">
              We use cookies and similar storage for authentication sessions, security, and basic preferences. Strictly
              necessary cookies keep you signed in across pages. Analytics or marketing cookies, if introduced later,
              will be disclosed here and, where required, gated behind consent. You can control cookies through your
              browser; disabling cookies may break sign-in.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">8. Children</h2>
            <p className="mt-3">
              The Service is not directed at children under 13. We do not knowingly collect personal information from
              children.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">9. International transfers</h2>
            <p className="mt-3">
              We may process data in the United States and other countries where our providers operate. Where required,
              we use appropriate safeguards for cross-border transfers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">10. Changes</h2>
            <p className="mt-3">
              We may update this Policy from time to time. Material changes will be posted on this page with an updated
              effective date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-[var(--color-brand)]">11. Contact</h2>
            <p className="mt-3">
              Privacy inquiries:{" "}
              <a href="mailto:hello@rebookt.com" className="text-[var(--color-brand-light)] underline">
                hello@rebookt.com
              </a>
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
