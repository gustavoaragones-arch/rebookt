"use client";

import { useState } from "react";

type Props = {
  images: string[];
  propertyName: string;
};

export function PropertyGallery({ images, propertyName }: Props) {
  const list = images.length > 0 ? images : [];
  const [active, setActive] = useState(0);
  const main = list[active] ?? null;

  return (
    <div className="w-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none bg-[var(--color-bg-subtle)] lg:rounded-lg">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element -- property URLs are host-controlled arbitrary origins
          <img src={main} alt={propertyName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-sans text-sm text-[var(--color-text-muted)]">
            Photos coming soon
          </div>
        )}
      </div>
      {list.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded border transition-colors ${
                i === active
                  ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]"
                  : "border-[var(--color-border)] opacity-80 hover:opacity-100"
              }`}
              aria-label={`Show image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
