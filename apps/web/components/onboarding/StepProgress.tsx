'use client';

import { useRef, useEffect } from 'react';

interface StepProgressProps {
  current: number;
  total: number;
}

export function StepProgress({ current, total }: StepProgressProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      bar.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      bar.style.transform = i < current ? 'scaleX(1)' : 'scaleX(0)';
    });
  }, [current]);

  return (
    <div className="flex flex-col gap-2" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bottle/8"
          >
            <div
              ref={(el) => { barRefs.current[i] = el; }}
              className="absolute inset-0 origin-left rounded-full bg-orange"
              style={{ transform: i < current ? 'scaleX(1)' : 'scaleX(0)' }}
            />
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-muted">
        {current} of {total}
      </span>
    </div>
  );
}
