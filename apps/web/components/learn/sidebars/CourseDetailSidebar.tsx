'use client';

import Link from 'next/link';
import {
  BookOpen,
  Video,
  Radio,
  Star,
  Users,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

const RELATED_COURSES = [
  { title: 'Creative Coding for Beginners', type: 'Video', rating: 4.8, students: '1.2k', gradient: 'linear-gradient(145deg, #1e3a5f, #3b82f6)' },
  { title: 'Advanced Typography Guide', type: 'E-Book', rating: 4.9, students: '890', gradient: 'linear-gradient(145deg, #7c2d12, #ea580c)' },
  { title: 'Live Design Critique', type: 'Live', rating: 4.7, students: '560', gradient: 'linear-gradient(145deg, #065f46, #34d399)' },
];

export default function CourseDetailSidebar() {
  return (
    <>
      {/* ── COURSE STATS — dark card ── */}
      <div className="overflow-hidden rounded-[16px] bg-neutral-800 p-5">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="h-2 w-2 rounded-full bg-success" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
          Course Stats
        </p>

        <div className="mt-4 space-y-3 text-[12px]">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Star size={12} className="text-warning" /> Rating
            </span>
            <span className="font-semibold text-white">4.9 / 5.0</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Users size={12} /> Enrolled
            </span>
            <span className="font-semibold text-white">2,840</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> Last updated
            </span>
            <span className="font-semibold text-white">2 days ago</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={12} /> Completion
            </span>
            <span className="font-semibold text-success">87%</span>
          </div>
        </div>
      </div>

      {/* ── RELATED COURSES ── */}
      <div className="rounded-[16px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
            Related Courses
          </p>
          <Link href="/courses" className="text-[11px] font-medium text-primary-500 transition-opacity hover:opacity-80">
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {RELATED_COURSES.map((course) => (
            <Link
              key={course.title}
              href="/courses"
              className="group flex items-center gap-3 rounded-[10px] p-1.5 transition-colors hover:bg-neutral-50"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-white"
                style={{ background: course.gradient }}
              >
                {course.type === 'Video' ? <Video size={14} /> : course.type === 'E-Book' ? <BookOpen size={14} /> : <Radio size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-neutral-800 line-clamp-1 group-hover:text-primary-500 transition-colors">
                  {course.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-0.5">
                    <Star size={9} className="fill-warning text-warning" /> {course.rating}
                  </span>
                  <span>{course.students}</span>
                  <span>· {course.type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── INSTRUCTOR ── */}
      <div className="rounded-[16px] bg-primary-500 p-5">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">
          About the Instructor
        </p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-[13px] font-bold text-white">
            NO
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">Nia Okafor</p>
            <p className="text-[11px] text-white/60">Product designer at Arc</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-white/70">
          12 courses · 4.8 avg rating · 8.2k students
        </p>
        <Link
          href="/courses"
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/80 transition-opacity hover:opacity-80"
        >
          View all courses
          <ArrowUpRight size={10} />
        </Link>
      </div>
    </>
  );
}
