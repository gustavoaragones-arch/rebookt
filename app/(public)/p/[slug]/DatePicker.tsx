"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  daysInMonth,
  formatYmd,
  startOfDay,
  startOfMonth,
} from "@/lib/booking-dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  blockedDates: string[];
  checkIn: Date | null;
  checkOut: Date | null;
  onRangeChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onBlockedRangeAttempt: () => void;
};

function useIsNarrow(breakpointPx: number) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [breakpointPx]);
  return narrow;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return formatYmd(a) === formatYmd(b);
}

function hasBlockedNight(
  checkIn: Date,
  checkOutExclusive: Date,
  blocked: Set<string>
): boolean {
  const cur = new Date(startOfDay(checkIn));
  const end = startOfDay(checkOutExclusive);
  while (cur < end) {
    if (blocked.has(formatYmd(cur))) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

type MonthGridProps = {
  monthAnchor: Date;
  blocked: Set<string>;
  today: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  onDayClick: (d: Date) => void;
};

function MonthGrid({ monthAnchor, blocked, today, checkIn, checkOut, onDayClick }: MonthGridProps) {
  const y = monthAnchor.getFullYear();
  const m = monthAnchor.getMonth();
  const first = new Date(y, m, 1);
  const lead = first.getDay();
  const dim = daysInMonth(y, m);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const inRange = (d: Date) => {
    if (!checkIn || !checkOut) return false;
    const t = startOfDay(d).getTime();
    return t > startOfDay(checkIn).getTime() && t < startOfDay(checkOut).getTime();
  };

  const isEndpoint = (d: Date) =>
    (checkIn && isSameDay(d, checkIn)) || (checkOut && isSameDay(d, checkOut));

  return (
    <div className="w-full">
      <div className="mb-3 text-center font-sans text-[13px] font-normal uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {monthLabel(monthAnchor)}
      </div>
      <div className="mb-2 grid grid-cols-7 gap-0 text-center font-sans text-[12px] text-[var(--color-text-muted)]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={`e-${i}`} className="h-10 w-10" />;
          }
          const ymd = formatYmd(d);
          const isPast = isBeforeDay(d, today);
          const isBlocked = blocked.has(ymd);
          const disabled = isPast || isBlocked;
          const rangeMid = inRange(d);
          const endpoint = isEndpoint(d);

          return (
            <div key={ymd} className="flex h-10 w-10 items-center justify-center">
              <button
                type="button"
                  disabled={disabled}
                  onClick={() => onDayClick(d)}
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full font-sans text-[14px] transition-colors",
                    disabled ? "pointer-events-none cursor-not-allowed text-[var(--color-text-muted)] line-through" : "",
                  !disabled && rangeMid
                    ? "bg-[color-mix(in_srgb,var(--color-brand)_15%,transparent)] text-[var(--color-text-primary)]"
                    : "",
                  !disabled && endpoint
                    ? "bg-[var(--color-brand)] text-white"
                    : "",
                  !disabled && !rangeMid && !endpoint
                    ? "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                    : "",
                ].join(" ")}
                aria-label={ymd}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DatePicker({
  blockedDates,
  checkIn,
  checkOut,
  onRangeChange,
  onBlockedRangeAttempt,
}: Props) {
  const blocked = useMemo(() => new Set(blockedDates), [blockedDates]);
  const narrow = useIsNarrow(640);
  const today = useMemo(() => startOfDay(new Date()), []);

  const initialMonth = useMemo(() => {
    if (checkIn) return startOfMonth(checkIn);
    return startOfMonth(today);
  }, [checkIn, today]);

  const [visibleMonth, setVisibleMonth] = useState(initialMonth);

  useEffect(() => {
    setVisibleMonth(initialMonth);
  }, [initialMonth]);

  const handleDayClick = useCallback(
    (d: Date) => {
      const day = startOfDay(d);
      if (isBeforeDay(day, today)) return;

      if (!checkIn || (checkIn && checkOut)) {
        onRangeChange(day, null);
        return;
      }

      const start = startOfDay(checkIn);
      const end = day;
      if (isBeforeDay(end, start) || isSameDay(end, start)) {
        onRangeChange(end, null);
        return;
      }

      if (hasBlockedNight(start, end, blocked)) {
        onBlockedRangeAttempt();
        onRangeChange(null, null);
        return;
      }

      onRangeChange(start, end);
    },
    [blocked, checkIn, checkOut, onRangeChange, onBlockedRangeAttempt, today]
  );

  const prev = () => setVisibleMonth((m) => addMonths(m, -1));
  const next = () => setVisibleMonth((m) => addMonths(m, 1));

  const secondMonth = addMonths(visibleMonth, 1);

  return (
    <div className="w-full">
      <div
        className={
          narrow
            ? "flex flex-col gap-6"
            : "flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between"
        }
      >
        {narrow ? (
          <>
            <MonthGrid
              monthAnchor={visibleMonth}
              blocked={blocked}
              today={today}
              checkIn={checkIn}
              checkOut={checkOut}
              onDayClick={handleDayClick}
            />
            <div className="flex justify-center py-1">
              <div
                className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-1 py-1 shadow-sm"
                role="group"
                aria-label="Previous or next month pair"
              >
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)] active:bg-[var(--color-bg-surface)]"
                  aria-label="Previous months"
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)] active:bg-[var(--color-bg-surface)]"
                  aria-label="Next months"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
            <MonthGrid
              monthAnchor={secondMonth}
              blocked={blocked}
              today={today}
              checkIn={checkIn}
              checkOut={checkOut}
              onDayClick={handleDayClick}
            />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={prev}
              className="order-1 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] sm:order-none sm:self-start sm:pt-10"
              aria-label="Previous month"
            >
              <ChevronLeft />
            </button>
            <div className="order-2 min-w-0 flex-1 sm:order-none">
              <MonthGrid
                monthAnchor={visibleMonth}
                blocked={blocked}
                today={today}
                checkIn={checkIn}
                checkOut={checkOut}
                onDayClick={handleDayClick}
              />
            </div>
            <button
              type="button"
              onClick={next}
              className="order-3 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] sm:order-none sm:self-start sm:pt-10"
              aria-label="Next month"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
