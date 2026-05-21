import Link from "next/link";
import { loginAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-email": "Please enter your email.",
  "missing-password": "Please enter your password.",
  "invalid-credentials": "Invalid email or password. Try again.",
  auth: "Sign in failed. Please try again.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const errKey = typeof searchParams.error === "string" ? searchParams.error : undefined;
  const err = errKey ? (ERROR_MESSAGES[errKey] ?? "Something went wrong. Try again.") : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-base)] px-6">
      <div className="card w-full max-w-md">
        <Link href="/" className="font-display text-2xl text-[var(--color-brand)]">
          Rebookt
        </Link>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Host sign in</p>

        {err ? <p className="mt-6 text-sm text-[var(--color-error)]">{err}</p> : null}

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
          <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            Password
            <input
              className="input mt-2"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn-primary w-full justify-center">
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
          <Link href="/" className="underline underline-offset-4">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
