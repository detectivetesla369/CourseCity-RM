'use client';

import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/* Demo activity dots — keyed by day-of-week index (0 = Mon) */
const DEMO_DOTS: Record<number, string[]> = {
  0: ['bg-primary-500', 'bg-error'],
  1: ['bg-success'],
  3: ['bg-success', 'bg-primary-500'],
  4: ['bg-success'],
};

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export default function WeekCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const dates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [selectedDate, setSelectedDate] = useState(today);

  // Format: "Friday, November 14, 2026"
  const currentDateLabel = useMemo(() => {
    const now = new Date();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    return `${dayName}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }, []);

  return (
    <div className="overflow-hidden rounded-[16px] bg-white">
      {/* Accent strip (10% — draws eye to schedule) */}
      <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-warning" />

      <div className="px-3 py-4 sm:px-5 sm:py-5">
      {/* ── Current date header ── */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-50">
          <CalendarDays size={18} className="text-primary-500" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-neutral-800">{currentDateLabel}</p>
          <p className="text-[11px] text-neutral-500">Your weekly schedule</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* ← Previous week */}
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          aria-label="Previous week"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Day columns */}
        <div className="flex flex-1 justify-between">
          {dates.map((date, i) => {
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDate);
            const dots = DEMO_DOTS[i] || [];

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center gap-1 rounded-[12px] px-1.5 py-1.5 transition-colors hover:bg-neutral-50 sm:px-2.5"
                style={{ minWidth: '40px' }}
              >
                {/* Day name */}
                <span
                  className={`text-[11px] leading-none ${
                    isSelected
                      ? 'font-bold text-primary-600'
                      : 'font-medium text-neutral-400'
                  }`}
                >
                  {DAY_NAMES[i]}
                </span>

                {/* Date circle */}
                <div
                  className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-medium transition-all ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-sm'
                      : isToday
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-700'
                  }`}
                >
                  {date.getDate()}
                </div>

                {/* Activity dots */}
                <div className="mt-0.5 flex h-2 items-center gap-1">
                  {dots.map((color, j) => (
                    <span
                      key={j}
                      className={`h-[5px] w-[5px] rounded-full ${color}`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* → Next week */}
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w + 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          aria-label="Next week"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-neutral-100 px-1 pt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="h-[6px] w-[6px] rounded-full bg-primary-500" />
          Remaining
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="h-[6px] w-[6px] rounded-full bg-success" />
          Done
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="h-[6px] w-[6px] rounded-full bg-error" />
          Missed
        </span>
      </div>
      </div>
    </div>
  );
}
