'use client';

import { BookOpen } from 'lucide-react';

interface SmallCourseCardProps {
  title: string;
  publisher: string;
  durationMins: number;
  gradient: string;
}

export default function SmallCourseCard({
  title,
  publisher,
  durationMins,
  gradient,
}: SmallCourseCardProps) {
  return (
    <div className="overflow-hidden rounded-[16px] bg-white transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div
        className="relative flex h-24 items-center justify-center"
        style={{ background: gradient }}
      >
        <BookOpen size={28} className="text-white/15" strokeWidth={1.2} />
        <span className="absolute right-3 top-3 rounded-[6px] bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {durationMins} min
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] text-neutral-500">{publisher}</p>
        <p className="mt-1 text-[13px] font-medium leading-snug text-neutral-800 line-clamp-2">
          {title}
        </p>
      </div>
    </div>
  );
}
