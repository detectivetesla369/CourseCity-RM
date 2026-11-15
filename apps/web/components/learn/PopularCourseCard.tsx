'use client';

import { Layers } from 'lucide-react';

interface PopularCourseCardProps {
  title: string;
  instructor: string;
  handle: string;
  durationMins: number;
  gradient: string;
  initial: string;
}

export default function PopularCourseCard({
  title,
  instructor,
  handle,
  durationMins,
  gradient,
  initial,
}: PopularCourseCardProps) {
  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden rounded-[16px] p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: gradient, minHeight: '240px' }}
    >
      {/* Instructor */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[13px] font-bold text-white backdrop-blur-sm">
          {initial}
        </div>
        <div>
          <p className="text-[13px] font-medium text-white">{instructor}</p>
          <p className="text-[11px] text-white/60">{handle}</p>
        </div>
      </div>

      {/* Duration badge */}
      <div className="absolute right-4 top-4">
        <span className="rounded-[6px] bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {durationMins} min
        </span>
      </div>

      {/* Decoration */}
      <div className="flex flex-1 items-center justify-center py-4 opacity-10">
        <Layers size={72} className="text-white" strokeWidth={0.8} />
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-bold leading-snug text-white line-clamp-2">
        {title}
      </h3>
    </div>
  );
}
