"use client";

import { useEffect, useState } from "react";

export function WidgetDemo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-md border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
      <div className="pointer-events-none absolute inset-0 border border-[var(--color-border)]" aria-hidden />
      <div className="p-8 pb-24">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Preview</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
          The live widget adds this floating control to your site. Click to open the booking modal.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-6 right-6 z-[1] animate-pulse-soft rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
      >
        Book direct — Save 10%
      </button>
      {open && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="relative mx-4 w-full max-w-[480px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="aspect-[4/5] w-full bg-[var(--color-bg-subtle)] p-6 text-sm text-[var(--color-text-secondary)]">
              <p className="font-display text-lg text-[var(--color-brand)]">Live preview</p>
              <p className="mt-2">
                Production embed loads your <code className="font-mono text-xs">/p/[slug]</code> booking page in an
                iframe.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
