import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-base)] px-6 text-center">
      <h1 className="font-display text-3xl text-[var(--color-brand)]">Property unavailable</h1>
      <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
        This direct booking link is not active.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Home
      </Link>
    </div>
  );
}
