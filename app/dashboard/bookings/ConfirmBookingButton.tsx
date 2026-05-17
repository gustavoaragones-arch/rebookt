"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConfirmBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, { method: "PATCH" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not confirm.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not confirm.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={confirm}
        disabled={loading}
        className="text-xs font-medium text-[var(--color-brand)] underline-offset-2 hover:underline disabled:opacity-50"
      >
        {loading ? "Confirming…" : "Mark as confirmed"}
      </button>
      {error ? <span className="text-[11px] text-[var(--color-error)]">{error}</span> : null}
    </div>
  );
}
