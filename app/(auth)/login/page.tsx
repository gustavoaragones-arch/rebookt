import Link from "next/link";
import { loginAction } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const check = searchParams.check === "email";
  const err = typeof searchParams.error === "string" ? searchParams.error : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-base)] px-6">
      <div className="card w-full max-w-md">
        <Link href="/" className="font-display text-2xl text-[var(--color-brand)]">
          Rebookt
        </Link>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Host sign in</p>

        {check && (
          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            Check your email for a magic link to continue.
          </p>
        )}

        {err && (
          <p className="mt-6 text-sm text-[var(--color-error)]">
            {err === "missing-email" && "Please enter your email."}
            {err === "send-failed" && "Could not send the link. Try again."}
            {err === "auth" && "Sign in failed. Request a new link."}
          </p>
        )}

        {!check && (
          <form action={loginAction} className="mt-8 space-y-4">
            <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
              Email
              <input
                className="input mt-2"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <button type="submit" className="btn-primary w-full justify-center">
              Send magic link
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
          <Link href="/" className="underline underline-offset-4">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
