'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Clock,
  Loader2,
  Star,
  Users,
  BookOpen,
  Plus,
} from 'lucide-react';
import type { CourseDetailDTO } from '@coursecity/contracts';
import { ApiClientError } from '@coursecity/api-client';
import { useAuth } from '@/lib/auth-context';
import ContentTypeBadge, {
  getCourseContentType,
  type CourseContentType,
} from '@/components/learn/ContentTypeBadge';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CATEGORIES = ['All', 'Design', 'Code', 'Research', 'Leadership'] as const;

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
] as const;

const CONTENT_FILTERS: { value: CourseContentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All courses' },
  { value: 'video', label: 'Video' },
  { value: 'ebook', label: 'E-Book' },
  { value: 'live', label: 'Live' },
];

/* ------------------------------------------------------------------ */
/*  Course Card — clean design matching reference images               */
/* ------------------------------------------------------------------ */
function CourseCard({ course, index }: { course: CourseDetailDTO; index: number }) {
  const formatPrice = (minor: number, currency: string) => {
    const amount = minor / 100;
    try {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const hours = Math.floor(course.estimatedDurationMinutes / 60);
  const mins = course.estimatedDurationMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  const publisherInitials = course.publisher.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const contentType = getCourseContentType(index);
  const progressVal = index === 0 ? 76 : index === 1 ? 32 : index === 2 ? 46 : 0;

  const coverGradients = [
    'linear-gradient(145deg, #c2410c 0%, #ea580c 40%, #f97316 100%)',
    'linear-gradient(145deg, #1e3a5f 0%, #2563eb 40%, #3b82f6 100%)',
    'linear-gradient(145deg, #065f46 0%, #059669 40%, #34d399 100%)',
    'linear-gradient(145deg, #7c2d12 0%, #b45309 40%, #d97706 100%)',
    'linear-gradient(145deg, #4c1d95 0%, #7c3aed 40%, #a78bfa 100%)',
    'linear-gradient(145deg, #9f1239 0%, #e11d48 40%, #fb7185 100%)',
  ];

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-[16px] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Cover image */}
      <div
        className="relative flex h-40 items-center justify-center"
        style={{ background: coverGradients[index % coverGradients.length] }}
      >
        {course.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverImageUrl} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <BookOpen size={40} className="text-white/20" strokeWidth={1.2} />
        )}
        {/* Duration badge */}
        <div className="absolute right-3 top-3">
          <span className="rounded-[6px] bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {durationLabel}
          </span>
        </div>
        {/* Content type badge */}
        <div className="absolute left-3 top-3">
          <ContentTypeBadge type={contentType} />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4 pb-5">
        {/* Category label */}
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary-500">
          {CATEGORIES[((index % (CATEGORIES.length - 1)) + 1)]}
        </p>

        <h3 className="text-[14px] font-bold leading-snug text-neutral-800 transition-colors group-hover:text-primary-500 line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500 line-clamp-2">
          {course.description?.slice(0, 100)}
        </p>

        {/* Instructor avatars */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[9px] font-bold text-neutral-500"
              >
                {String.fromCharCode(65 + ((index * 3 + i) % 26))}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar or price */}
        {course.isEnrolled ? (
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${
                    index % 3 === 0
                      ? 'bg-info'
                      : index % 3 === 1
                        ? 'bg-primary-500'
                        : 'bg-success'
                  }`}
                  style={{ width: `${progressVal}%` }}
                />
              </div>
              <span className="ml-3 text-[12px] font-semibold text-neutral-600">{progressVal}%</span>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-warning text-warning" />
                <span className="text-[12px] font-medium text-neutral-700">4.{7 + (index % 3)}</span>
              </div>
              <span className="text-[14px] font-bold text-neutral-800">
                {course.isFree ? (
                  <span className="text-success">Free</span>
                ) : (
                  formatPrice(course.priceMinor, course.currency)
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */
function CourseCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[16px] bg-white shadow-sm">
      <div className="h-40 bg-neutral-100" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-16 rounded bg-neutral-100" />
        <div className="h-4 w-3/4 rounded bg-neutral-100" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-1/2 rounded bg-neutral-100" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Courses Page                                                  */
/* ------------------------------------------------------------------ */
export default function CoursesPage() {
  const { api } = useAuth();
  const [courses, setCourses] = useState<CourseDetailDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 12;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [contentFilter, setContentFilter] = useState<CourseContentType | 'all'>('all');
  const [sort, setSort] = useState<string>('recommended');

  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const sortValue = sort === 'recommended' ? 'newest' : sort;
      const res = await api.getCatalog({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort: sortValue as 'newest' | 'popular' | 'price_asc' | 'price_desc',
      });
      if (requestId === requestIdRef.current) {
        setCourses(res.courses);
        setTotal(res.total);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof ApiClientError ? err.problem.detail : 'Failed to load courses.');
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, debouncedSearch, sort, api]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const totalPages = Math.ceil(total / limit);
  const activeFilterCount = [
    debouncedSearch,
    activeCategory !== 'All' ? activeCategory : '',
    contentFilter !== 'all' ? contentFilter : '',
  ].filter(Boolean).length;

  // Client-side filter by content type
  const filteredCourses =
    contentFilter === 'all'
      ? courses
      : courses.filter((_, i) => getCourseContentType(i) === contentFilter);

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-bold text-neutral-800 lg:text-[32px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            My Courses
          </h1>
        </div>

        {/* Content type dropdown */}
        <div className="relative">
          <select
            value={contentFilter}
            onChange={(e) => {
              setContentFilter(e.target.value as CourseContentType | 'all');
              setPage(1);
            }}
            className="appearance-none rounded-[10px] border border-neutral-200 bg-white py-2 pl-4 pr-8 text-[13px] font-medium text-neutral-700 transition-colors focus:border-primary-500 focus:outline-none"
          >
            {CONTENT_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        </div>
      </div>

      {/* ─── Search + Category Filter Bar ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[44px] w-full rounded-[12px] border border-neutral-200 bg-white pl-10 pr-10 text-[14px] text-neutral-800 placeholder:text-neutral-400 transition-all focus:border-primary-500 focus:shadow-focus focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
              className={`rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-500 hover:bg-white hover:text-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Sort + Filter controls ─── */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-neutral-500">
          <span className="font-semibold text-neutral-700">{total}</span> courses found
        </p>
        <div className="flex items-center gap-3">
          <button
            className={`flex items-center gap-2 rounded-[10px] border px-3.5 py-2 text-[12px] font-medium transition-colors ${
              activeFilterCount > 0
                ? 'border-primary-200 bg-primary-50 text-primary-600'
                : 'border-neutral-200 text-neutral-500 hover:bg-white hover:text-neutral-700'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-neutral-400">Sort:</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-transparent pr-4 text-[12px] font-semibold text-neutral-700 focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="rounded-[12px] border border-error/20 bg-error-light p-4 text-center">
          <p className="text-[12px] font-semibold text-error">{error}</p>
          <button onClick={fetchCourses} className="mt-2 text-[11px] font-bold text-error underline">
            Try again
          </button>
        </div>
      )}

      {/* ─── Course Grid ─── */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center rounded-[16px] bg-white py-16 text-center shadow-sm">
          <Search size={36} className="mb-3 text-neutral-300" />
          <h2 className="text-[16px] font-bold text-neutral-800">No courses found</h2>
          <p className="mt-1 text-[12px] text-neutral-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-[10px] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="px-3 text-[13px] text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-[10px] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
