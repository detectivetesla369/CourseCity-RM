'use client';

import Link from 'next/link';
import {
  Video,
  Clock,
  Star,
  Pencil,
  Users,
  ArrowUpRight,
  Play,
} from 'lucide-react';

const RELATED_VIDEOS = [
  { title: 'Motion Design Basics', instructor: 'Lana Mora', duration: '45m', rating: 4.8 },
  { title: 'Color Theory for UI', instructor: 'Uran Design', duration: '32m', rating: 4.9 },
  { title: 'Prototyping in Figma', instructor: 'Chris Nguyen', duration: '1h 10m', rating: 4.7 },
];

export default function VideoCourseSidebar() {
  return (
    <>
      {/* ── NOW WATCHING — dark card ── */}
      <div className="overflow-hidden rounded-[16px] bg-neutral-800 p-5">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="h-2 w-2 rounded-full bg-success" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
          Now Watching
        </p>

        {/* Mini video preview */}
        <div className="my-4 flex aspect-video items-center justify-center overflow-hidden rounded-[10px] bg-neutral-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play size={16} className="translate-x-[1px] text-white" />
          </div>
        </div>

        <div className="space-y-2 text-[12px]">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Progress</span>
            <span className="font-semibold text-white">45%</span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-neutral-600">
            <div className="h-full w-[45%] rounded-full bg-primary-500" />
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Remaining</span>
            <span className="font-semibold text-white">38 min</span>
          </div>
        </div>
      </div>

      {/* ── UP NEXT — related videos ── */}
      <div className="rounded-[16px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
            Up Next
          </p>
          <Link href="/courses" className="text-[11px] font-medium text-primary-500 transition-opacity hover:opacity-80">
            See all
          </Link>
        </div>

        <div className="space-y-3">
          {RELATED_VIDEOS.map((vid) => (
            <Link
              key={vid.title}
              href="/courses"
              className="group flex items-center gap-3 rounded-[10px] p-1.5 transition-colors hover:bg-neutral-50"
            >
              <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-[8px] bg-neutral-100">
                <Video size={14} className="text-neutral-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-neutral-800 line-clamp-1 group-hover:text-primary-500 transition-colors">
                  {vid.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-500">
                  <span>{vid.instructor}</span>
                  <span>· {vid.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── STUDY NOTES ── */}
      <div className="rounded-[16px] p-5" style={{ background: 'linear-gradient(145deg, #1a3a2a 0%, #1e4030 100%)' }}>
        <div className="mb-3 flex items-center gap-1.5">
          <Pencil size={12} className="text-emerald-400" />
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-400/70">
            Study Notes
          </p>
        </div>
        <p className="text-[13px] font-medium leading-snug text-white">
          Remember to practice the layer technique shown at 12:34.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button className="rounded-[6px] bg-white/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-white/15">
            + Add note
          </button>
          <Link
            href="/learn"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400/70 transition-opacity hover:opacity-80"
          >
            View all
            <ArrowUpRight size={10} />
          </Link>
        </div>
      </div>
    </>
  );
}
