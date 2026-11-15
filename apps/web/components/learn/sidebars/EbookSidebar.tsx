'use client';

import Link from 'next/link';
import {
  BookOpen,
  Bookmark,
  Clock,
  Star,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';

const RELATED_BOOKS = [
  {
    title: 'Advanced Design Patterns',
    author: 'Nia Okafor',
    gradient: 'linear-gradient(145deg, #7c2d12 0%, #ea580c 100%)',
  },
  {
    title: 'Creative Coding Essentials',
    author: 'Milo Chen',
    gradient: 'linear-gradient(145deg, #1e3a5f 0%, #3b82f6 100%)',
  },
  {
    title: 'Research Field Notes',
    author: 'Jo Alabi',
    gradient: 'linear-gradient(145deg, #065f46 0%, #34d399 100%)',
  },
  {
    title: 'Leadership in Practice',
    author: 'Amara Reed',
    gradient: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 100%)',
  },
];

export default function EbookSidebar() {
  return (
    <>
      {/* ── READING PROGRESS ── */}
      <div className="overflow-hidden rounded-[16px] bg-neutral-800 p-5">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="h-2 w-2 rounded-full bg-success" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
          Reading Progress
        </p>

        {/* Progress ring */}
        <div className="my-5 flex items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="#ff6400" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - 0.35)}`}
              />
            </svg>
            <span className="absolute text-[18px] font-bold text-white">35%</span>
          </div>
        </div>

        <div className="space-y-2 text-[12px]">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Pages read</span>
            <span className="font-semibold text-white">42 / 120</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Time spent</span>
            <span className="font-semibold text-white">1h 24m</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Bookmarks</span>
            <span className="font-semibold text-white">3</span>
          </div>
        </div>
      </div>

      {/* ── YOUR BOOKSHELF — stacked book covers like reference ── */}
      <div className="rounded-[16px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
            Your Bookshelf
          </p>
          <Link
            href="/courses"
            className="text-[11px] font-medium text-primary-500 transition-opacity hover:opacity-80"
          >
            View all
          </Link>
        </div>

        {/* Stacked book spines — like reference image sidebar */}
        <div className="space-y-2.5">
          {RELATED_BOOKS.map((book) => (
            <Link
              key={book.title}
              href="/courses"
              className="group flex items-center gap-3 rounded-[10px] p-1.5 transition-colors hover:bg-neutral-50"
            >
              {/* Mini book cover */}
              <div
                className="flex h-14 w-10 shrink-0 items-end justify-start overflow-hidden rounded-[3px] p-1.5 shadow-sm transition-transform group-hover:scale-105"
                style={{ background: book.gradient }}
              >
                {/* Spine line */}
                <div className="absolute inset-y-0 left-0 w-[3px] bg-black/15" />
                <BookOpen size={8} className="text-white/50" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold leading-snug text-neutral-800 line-clamp-2 group-hover:text-primary-500 transition-colors">
                  {book.title}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-500">{book.author}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Expand bookshelf link */}
        <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-[8px] bg-neutral-50 py-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
          Expand Bookshelf
          <ChevronRight size={12} />
        </button>
      </div>

      {/* ── BOOKMARKS ── */}
      <div className="rounded-[16px] p-5" style={{ background: 'linear-gradient(145deg, #1a3a2a 0%, #1e4030 100%)' }}>
        <div className="mb-3 flex items-center gap-1.5">
          <Bookmark size={12} className="text-emerald-400" />
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-400/70">
            Bookmarks
          </p>
        </div>
        <div className="space-y-2.5">
          <div className="rounded-[8px] bg-white/8 px-3 py-2">
            <p className="text-[12px] font-medium text-white line-clamp-1">
              Key principles of token design
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-400/60">Chapter 2, Page 24</p>
          </div>
          <div className="rounded-[8px] bg-white/8 px-3 py-2">
            <p className="text-[12px] font-medium text-white line-clamp-1">
              Pattern library structure
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-400/60">Chapter 4, Page 58</p>
          </div>
          <div className="rounded-[8px] bg-white/8 px-3 py-2">
            <p className="text-[12px] font-medium text-white line-clamp-1">
              Documentation best practices
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-400/60">Chapter 5, Page 72</p>
          </div>
        </div>
      </div>
    </>
  );
}
