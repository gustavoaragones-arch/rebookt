import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          <div>
            <p className="font-display text-lg text-[var(--color-brand)]">Rebookt</p>
            <p className="mt-3 text-xs leading-relaxed">
              Direct booking recovery for short-term rental hosts. Works alongside Airbnb — built for conversion,
              not for replacing your channel.
            </p>
          </div>
          <nav aria-label="Footer">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Company
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-[var(--color-text-primary)] hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--color-text-primary)] hover:underline">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/privacy#cookies" className="hover:text-[var(--color-text-primary)] hover:underline">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--color-text-primary)] hover:underline">
                  Terms
                </Link>
              </li>
            </ul>
          </nav>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Disclaimer
            </p>
            <p className="mt-4 text-xs leading-relaxed">
              Rebookt is a software tool for hosts; it does not provide legal, tax, or insurance advice. Features
              depend on correct configuration and compliance with Airbnb, Google, and other platforms&apos; rules.
              Automated messages and rewards must be used responsibly. Nothing on this site is legal advice; review
              policies with qualified counsel.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-8 text-xs text-[var(--color-text-muted)] sm:flex-row sm:gap-6">
          <p>© {year} Rebookt. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-[var(--color-text-primary)] hover:underline">
              Terms of Service
            </Link>
            <span className="text-[var(--color-border-strong)]" aria-hidden>
              ·
            </span>
            <Link href="/privacy" className="hover:text-[var(--color-text-primary)] hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
