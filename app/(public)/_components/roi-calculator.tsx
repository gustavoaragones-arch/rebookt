"use client";

import { useMemo, useState } from "react";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function RoiCalculator() {
  const [avg, setAvg] = useState(2500);
  const [repeats, setRepeats] = useState(6);

  const { saved, net } = useMemo(() => {
    const savings = avg * 0.12 * repeats;
    const cost = 49 * 12;
    return { saved: savings, net: savings - cost };
  }, [avg, repeats]);

  return (
    <div className="card max-w-xl">
      <h3 className="font-display text-2xl text-[var(--color-brand)]">ROI calculator</h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Model assumes ~12% platform fees on repeat bookings you move to direct checkout.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Average booking value
          <input
            type="number"
            min={0}
            className="input mt-2"
            value={avg}
            onChange={(e) => setAvg(Number(e.target.value) || 0)}
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Repeat bookings per year
          <input
            type="number"
            min={0}
            className="input mt-2"
            value={repeats}
            onChange={(e) => setRepeats(Number(e.target.value) || 0)}
          />
        </label>
      </div>
      <dl className="mt-8 space-y-3 border-t border-[var(--color-border)] pt-8 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--color-text-secondary)]">Platform fees saved per year</dt>
          <dd className="font-medium">{money(saved)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-text-secondary)]">Your cost</dt>
          <dd className="font-medium">{money(588)} / year ($49/month)</dd>
        </div>
        <div className="flex justify-between text-[var(--color-brand-accent)]">
          <dt className="font-medium">Net gain</dt>
          <dd className="font-medium">{money(net)}</dd>
        </div>
      </dl>
    </div>
  );
}
