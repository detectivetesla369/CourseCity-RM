'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  ChevronRight,
  Search,
  Bookmark,
  Grid3X3,
  List,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { EnrollmentDTO } from '@coursecity/contracts';

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */
function LibrarySkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-bottle/5" />
        <div className="h-9 w-60 rounded-xl bg-bottle/5" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-[20px] bg-bottle/5" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */
function EmptyLibrary() {
  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-2">Your library</p>
        <h1
          className="text-[2rem] font-extrabold tracking-tight text-bottle leading-[1.1]"
          style={{ letterSpacing: '-0.03em' }}
        >
          Nothing here yet.
        </h1>
        <p className="mt-2 text-[14px] text-muted/60">Courses you enroll in land here — your personal shelf.</p>
      </div>

      <div className="flex flex-col items-center rounded-[28px] bg-white py-16 shadow-lift-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange/8">
          <Bookmark size={28} className="text-orange" />
        </div>
        <h2 className="text-[1.2rem] font-bold text-bottle">Start building your library</h2>
        <p className="mt-1 max-w-sm text-center text-[14px] text-muted/55 leading-relaxed">
          Browse the catalogue and enroll in courses. They&apos;ll appear here with progress tracking, bookmarks, and notes.
        </p>
        <Link href="/courses" className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white shadow-lift-sm transition-all hover:-translate-y-0.5 hover:shadow-lift-md">
          <Search size={16} />
          Explore courses
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Course card                                                        */
/* ------------------------------------------------------------------ */
const COVER_COLORS = [
  'from-orange/20 to-orange-wash',
  'from-blue-wash to-salad-wash',
  'from-salad-wash to-egg',
  'from-orange-wash to-blue-wash',
];

function LibraryCourseCard({ enrollment, index }: { enrollment: EnrollmentDTO; index: number }) {
  const isCompleted = enrollment.status === 'COMPLETED' || enrollment.progressPercentage >= 100;
  const gradient = COVER_COLORS[index % COVER_COLORS.length];

  return (
    <Link
      href={`/learn/courses/${enrollment.courseId}`}
      className="group flex flex-col overflow-hidden rounded-[20px] bg-white shadow-lift-sm transition-all hover:-translate-y-1 hover:shadow-lift-md"
    >
      {/* Cover */}
      <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${gradient}`}>
        <span className="text-5xl font-extrabold opacity-15 text-bottle">
          {enrollment.courseTitle.charAt(0)}
        </span>
        {/* Bookmark icon decoration */}
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-bottle/40 backdrop-blur-sm transition-colors group-hover:text-orange">
          <Bookmark size={14} />
        </div>
        {/* Status badge */}
        <div className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
          isCompleted
            ? 'bg-salad/20 text-bottle'
            : 'bg-white/70 text-orange-ink'
        }`}>
          {isCompleted ? 'Completed' : 'In progress'}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[14px] font-bold leading-snug text-bottle group-hover:text-orange-ink transition-colors line-clamp-2">
          {enrollment.courseTitle}
        </h3>
        <p className="mt-1.5 text-[12px] text-muted/60">
          Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Progress */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted/60">Progress</span>
            <span className={`font-bold ${isCompleted ? 'text-salad' : 'text-orange'}`}>
              {enrollment.progressPercentage}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-egg-deep/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-salad' : 'bg-orange'}`}
              style={{ width: `${enrollment.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
type ViewMode = 'grid' | 'list';
type FilterTab = 'all' | 'active' | 'completed';

export default function LibraryPage() {
  const { api } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [tab, setTab] = useState<FilterTab>('all');

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getEnrollments();
      setEnrollments(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = enrollments.filter((e) => {
    const matchesSearch = !search || e.courseTitle.toLowerCase().includes(search.toLowerCase());
    const isCompleted = e.status === 'COMPLETED' || e.progressPercentage >= 100;
    const matchesTab =
      tab === 'all' ||
      (tab === 'active' && !isCompleted) ||
      (tab === 'completed' && isCompleted);
    return matchesSearch && matchesTab;
  });

  if (loading) return <LibrarySkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-bold text-bottle">Failed to load your library</h2>
        <p className="mt-1 text-sm text-muted">Please check your connection and try again.</p>
        <button onClick={fetchData} className="mt-6 rounded-full bg-bottle px-6 py-2.5 text-sm font-semibold text-egg">
          Retry
        </button>
      </div>
    );
  }

  if (enrollments.length === 0) return <EmptyLibrary />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Your shelf</p>
          <h1
            className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem] leading-[1.05]"
            style={{ letterSpacing: '-0.02em' }}
          >
            My Library
          </h1>
          <p className="mt-1 text-[14px] text-muted/60">
            {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Link
          href="/courses"
          className="flex items-center gap-1.5 rounded-xl border-2 border-bottle/10 px-4 py-2 text-[14px] font-semibold text-bottle transition-colors hover:border-bottle/20"
        >
          Browse more <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="search"
            placeholder="Search your courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-bottle/8 bg-white py-2.5 pl-10 pr-4 text-[14px] text-bottle placeholder:text-muted/40 transition-colors focus:border-orange/40 focus:outline-none"
          />
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1">
          {(['all', 'active', 'completed'] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-3.5 py-2 text-[14px] font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-bottle text-egg'
                  : 'text-muted hover:bg-white hover:text-bottle'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="hidden items-center gap-1 rounded-xl border border-bottle/8 bg-white p-1 sm:flex">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'grid' ? 'bg-egg text-bottle' : 'text-muted/40 hover:text-bottle'}`}
            aria-label="Grid view"
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'list' ? 'bg-egg text-bottle' : 'text-muted/40 hover:text-bottle'}`}
            aria-label="List view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bookmark size={32} className="mb-3 text-muted/20" />
          <p className="text-sm font-semibold text-bottle">No courses match your filter</p>
          <p className="mt-1 text-xs text-muted">Try adjusting your search or filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((enrollment, i) => (
            <LibraryCourseCard key={enrollment.id} enrollment={enrollment} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((enrollment) => {
            const isCompleted = enrollment.status === 'COMPLETED' || enrollment.progressPercentage >= 100;
            const barColor = isCompleted ? 'bg-salad' : 'bg-orange';
            return (
              <Link
                key={enrollment.id}
                href={`/learn/courses/${enrollment.courseId}`}
                className="group flex items-center gap-4 rounded-[16px] bg-white p-4 shadow-lift-sm transition-all hover:-translate-y-0.5 hover:shadow-lift-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-lg font-bold text-orange">
                  {enrollment.courseTitle.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-bottle">{enrollment.courseTitle}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted/60">
                    <Clock size={11} />
                    {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${isCompleted ? 'bg-salad/10 text-bottle' : 'bg-orange/10 text-orange-ink'}`}>
                      {isCompleted ? 'Done' : `${enrollment.progressPercentage}%`}
                    </span>
                  </div>
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-egg-deep/60">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    />
                  </div>
                </div>
                <ChevronRight size={14} className="shrink-0 text-muted/30 group-hover:text-bottle" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
