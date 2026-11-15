'use client';

import Link from 'next/link';
import {
  TrendingUp,
  BookOpen,
  Video,
  Radio,
  Star,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

const TRENDING = [
  { title: 'Design Systems Fundamentals', type: 'Video', rating: 4.9, students: '2.4k', color: 'bg-info' },
  { title: 'UX Research Methods', type: 'E-Book', rating: 4.8, students: '1.8k', color: 'bg-primary-500' },
  { title: 'Live UI Workshop', type: 'Live', rating: 4.7, students: '980', color: 'bg-success' },
];

const CATEGORIES_STATS = [
  { name: 'Design', count: 48, color: 'bg-primary-500' },
  { name: 'Code', count: 36, color: 'bg-info' },
  { name: 'Research', count: 24, color: 'bg-success' },
  { name: 'Leadership', count: 18, color: 'bg-warning' },
];

export default function CoursesCatalogSidebar() {
  return (
    <>
      {/* ── TRENDING NOW ── */}
      <div className="rounded-[16px] bg-neutral-800 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Flame size={14} className="text-primary-400" />
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
            Trending Now
          </p>
        </div>
        <div className="space-y-3">
          {TRENDING.map((course) => (
            <Link
              key={course.title}
              href="/courses"
              className="group flex items-start gap-3 rounded-[10px] p-1.5 transition-colors hover:bg-white/5"
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] ${course.color} text-white`}>
                {course.type === 'Video' ? <Video size={13} /> : course.type === 'E-Book' ? <BookOpen size={13} /> : <Radio size={13} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold leading-snug text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                  {course.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-0.5">
                    <Star size={9} className="fill-warning text-warning" /> {course.rating}
                  </span>
                  <span>{course.students}</span>
                  <span className="text-neutral-600">· {course.type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div className="rounded-[16px] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
          Browse by Category
        </p>
        <div className="space-y-2.5">
          {CATEGORIES_STATS.map((cat) => (
            <Link
              key={cat.name}
              href="/courses"
              className="flex items-center justify-between rounded-[10px] px-3 py-2.5 transition-colors hover:bg-neutral-50"
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                <span className="text-[13px] font-medium text-neutral-700">{cat.name}</span>
              </div>
              <span className="text-[12px] font-semibold text-neutral-400">{cat.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CONTENT TYPES ── */}
      <div className="rounded-[16px] bg-primary-500 p-5">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">
          Content Types
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-[13px] text-white">
            <Video size={14} className="text-white/70" />
            <span className="font-medium">Video Courses</span>
            <span className="ml-auto text-[11px] text-white/50">62</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-white">
            <BookOpen size={14} className="text-white/70" />
            <span className="font-medium">E-Books</span>
            <span className="ml-auto text-[11px] text-white/50">34</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-white">
            <Radio size={14} className="text-white/70" />
            <span className="font-medium">Live Sessions</span>
            <span className="ml-auto text-[11px] text-white/50">12</span>
          </div>
        </div>
      </div>
    </>
  );
}
