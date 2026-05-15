import Link from "next/link";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const hasSession = Boolean(searchParams.session_id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-base)] px-6">
      <div className="card max-w-lg text-center">
        <h1 className="font-display text-3xl text-[var(--color-brand)]">You are booked</h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {hasSession
            ? "Thank you for booking direct. A confirmation email is on the way."
            : "Thank you. If you completed checkout, a confirmation email is on the way."}
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Return home
        </Link>
      </div>
    </div>
  );
}
