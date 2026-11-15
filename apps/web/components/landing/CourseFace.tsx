'use client';

import type { ButtonHTMLAttributes } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { TopCourse } from './top-courses';

/**
 * Course card face, laid out on a fixed 245×280 box.
 *
 * - `overlay`: transparent — drawn on top of the 3D slab, whose tint panel and
 *   accent stripe are meshes. Coordinates below mirror the mesh geometry
 *   (1 world unit = 100px at the scene's distanceFactor).
 * - `card`: draws its own surface, tint and stripe — used when WebGL is off
 *   (mobile, touch, reduced motion).
 */
interface CourseFaceProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  course: TopCourse;
  variant: 'overlay' | 'card';
}

export function CourseFace({ course, variant, className = '', ...rest }: CourseFaceProps) {
  const isCard = variant === 'card';

  return (
    <button
      type="button"
      className={`relative block h-[280px] w-[245px] shrink-0 text-left ${
        isCard
          ? 'transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03]'
          : ''
      } ${className}`}
      {...rest}
    >
      {isCard && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[13px] bg-[#fbfbfa] shadow-[0_10px_30px_rgba(0,50,35,0.10),0_2px_6px_rgba(0,50,35,0.06)]"
          />
          <span
            aria-hidden="true"
            className="absolute left-[13.5px] right-[13.5px] top-[18px] h-[118px] rounded-[4px]"
            style={{ background: course.tint }}
          />
          <span
            aria-hidden="true"
            className="absolute left-[13.5px] right-[13.5px] top-[134.5px] h-[5px]"
            style={{ background: course.accent }}
          />
        </>
      )}

      {/* Course cover image (if present) */}
      {course.image && (
        <span
          aria-hidden="true"
          className="absolute left-[13.5px] right-[13.5px] top-[18px] h-[118px] overflow-hidden rounded-[4px]"
        >
          <img
            src={course.image}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-bottle/60 via-bottle/15 to-transparent" />
        </span>
      )}

      {/* Upper (tinted) area */}
      <span className="absolute left-[26px] right-[26px] top-[30px] flex items-start justify-between">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-white shadow-sm"
          style={{ background: course.accent }}
        >
          {course.icon}
        </span>
        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] text-bottle">
          #{course.rank} MOST PURCHASED
        </span>
      </span>
      <span
        className={`absolute left-[26px] right-[26px] top-[106px] text-[10px] font-semibold tracking-[0.14em] ${
          course.image ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : 'text-bottle/60'
        }`}
      >
        {course.category}
      </span>

      {/* Lower area, below the accent stripe */}
      <span className="absolute left-[26px] right-[26px] top-[154px]">
        <span className="block text-[17px] font-bold leading-tight text-bottle">{course.title}</span>
        <span className="mt-1 block text-[13px] leading-snug text-muted">{course.copy}</span>
      </span>
      <span className="absolute bottom-[22px] left-[26px] right-[26px] flex items-center justify-between border-t border-bottle/10 pt-2.5 text-[11px]">
        <span className="text-muted">{course.stat}</span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-orange-ink">
          Open course <ArrowUpRight size={11} />
        </span>
      </span>
    </button>
  );
}
