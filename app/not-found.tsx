import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-base)] px-6 text-center">
      <h1 className="font-display text-3xl text-[var(--color-brand)]">Page not found</h1>
      <Link href="/" className="btn-primary mt-8">
        Home
      </Link>
    </div>
  );
}
