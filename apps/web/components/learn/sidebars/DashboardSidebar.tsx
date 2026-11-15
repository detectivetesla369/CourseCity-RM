'use client';

import Link from 'next/link';
import {
  MoreHorizontal,
  BookOpen,
  Zap,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';

export default function DashboardSidebar() {
  return (
    <>
      {/* ── NOW STUDYING — dark card ── */}
      <div className="overflow-hidden rounded-[16px] bg-neutral-800 p-5">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="h-2 w-2 rounded-full bg-success" />
        </div>
        <p className="eyebrow mb-3 !text-neutral-500">NOW STUDYING</p>
        <div className="mb-4 flex items-center justify-center py-3">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-[3px] border-neutral-600" />
            <div className="absolute left-1/2 top-0 h-8 w-[3px] -translate-x-1/2 rounded-full bg-neutral-600" />
            <div className="absolute right-1 top-3 h-3 w-3 rounded-full bg-primary-500" />
          </div>
        </div>
        <p className="text-[15px] font-bold text-white">CourseCity / Learning</p>
        <p className="mt-0.5 text-[12px] text-neutral-500">Your current focus</p>
      </div>

      {/* ── QUICK ACTIONS — primary tint card ── */}
      <div className="rounded-[16px] bg-primary-500 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow !text-white/60">QUICK ACTIONS</p>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="More actions"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/learn" className="flex items-center gap-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-80">
            <BookOpen size={14} className="shrink-0 text-white/70" />
            Resume last lesson
          </Link>
          <Link href="/courses" className="flex items-center gap-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-80">
            <Zap size={14} className="shrink-0 text-white/70" />
            Browse new courses
          </Link>
          <Link href="/learn" className="flex items-center gap-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-80">
            <RotateCcw size={14} className="shrink-0 text-white/70" />
            Continue your streak
          </Link>
        </div>
      </div>

      {/* ── PINNED NOTES — dark teal card ── */}
      <div className="rounded-[16px] p-5" style={{ background: 'linear-gradient(145deg, #1a3a2a 0%, #1e4030 100%)' }}>
        <p className="eyebrow mb-3 !text-emerald-400/70">PINNED NOTES</p>
        <p className="text-[14px] font-medium leading-snug text-white">
          Small steps make surprisingly good progress.
        </p>
        <Link
          href="/learn"
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-400 transition-opacity hover:opacity-80"
        >
          Open the wall
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </>
  );
}
