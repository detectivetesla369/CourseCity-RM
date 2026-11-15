'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Star,
  Clock,
  FileText,
  Globe,
  Calendar,
  Bookmark,
  Share2,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { CourseDetailDTO } from '@coursecity/contracts';
import ContentTypeBadge from '@/components/learn/ContentTypeBadge';

/* ------------------------------------------------------------------ */
/*  E-Book Cover                                                       */
/* ------------------------------------------------------------------ */
function EbookCover({ title }: { title: string }) {
  return (
    <div className="group relative perspective-[1200px]">
      {/* Shadow beneath */}
      <div className="absolute inset-x-6 -bottom-3 h-6 rounded-[50%] bg-black/10 blur-xl" />
      {/* Book */}
      <div
        className="relative flex h-[380px] w-[260px] flex-col justify-end overflow-hidden rounded-[4px] p-6 shadow-lg transition-transform duration-300 group-hover:rotate-y-[-4deg]"
        style={{
          background: 'linear-gradient(145deg, #c2410c 0%, #ea580c 50%, #f97316 100%)',
        }}
      >
        {/* Spine edge */}
        <div className="absolute inset-y-0 left-0 w-[6px] bg-black/15" />
        {/* Title */}
        <div className="relative z-10">
          <div className="mb-2 h-px w-12 bg-white/40" />
          <h3 className="text-[18px] font-bold leading-tight text-white">
            {title}
          </h3>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-white/60">
            CourseCity Edition
          </p>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/8" />
        <div className="absolute right-12 top-16 h-20 w-20 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table of Contents Sidebar                                          */
/* ------------------------------------------------------------------ */
function TableOfContents({
  modules,
  activeChapter,
  onSelect,
}: {
  modules: CourseDetailDTO['modules'];
  activeChapter: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[14px] font-bold text-neutral-800">Table of Contents</h3>
      <div className="space-y-1">
        {modules
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((mod, i) => {
            const isActive = i === activeChapter;
            return (
              <button
                key={mod.id}
                onClick={() => onSelect(i)}
                className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors ${
                  isActive
                    ? 'bg-primary-50 font-semibold text-primary-600'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-bold ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="line-clamp-1">{mod.title}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Card                                                        */
/* ------------------------------------------------------------------ */
function ReviewCard() {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[14px] font-bold text-neutral-800">Reader Reviews</h3>

      <div className="space-y-4">
        {/* Review 1 */}
        <div className="rounded-[12px] bg-neutral-50 p-4">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-600">
              CR
            </div>
            <div>
              <p className="text-[13px] font-semibold text-neutral-800">Christopher Reath</p>
              <p className="text-[11px] text-neutral-500">Verified Reader</p>
            </div>
          </div>
          <div className="mb-2 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={12} className={s <= 4 ? 'fill-warning text-warning' : 'text-neutral-300'} />
            ))}
          </div>
          <p className="text-[13px] leading-relaxed text-neutral-600">
            &ldquo;Well-structured content that breaks down complex topics into digestible chapters. Great for self-paced learning.&rdquo;
          </p>
        </div>

        {/* Review 2 */}
        <div className="rounded-[12px] bg-neutral-50 p-4">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-light text-[11px] font-bold text-success">
              AM
            </div>
            <div>
              <p className="text-[13px] font-semibold text-neutral-800">Adaeze Madu</p>
              <p className="text-[11px] text-neutral-500">Verified Reader</p>
            </div>
          </div>
          <div className="mb-2 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={12} className="fill-warning text-warning" />
            ))}
          </div>
          <p className="text-[13px] leading-relaxed text-neutral-600">
            &ldquo;Perfect companion to the video courses. The examples are practical and the writing style is very clear.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  E-Book Page (Main)                                                 */
/* ------------------------------------------------------------------ */
export default function EbookPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { api } = useAuth();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    if (!courseId) return;
    api
      .getCourseBySlug(courseId)
      .then((data: CourseDetailDTO) => {
        setCourse(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId, api]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-5 w-32 rounded bg-neutral-100" />
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="h-[380px] w-[260px] rounded-[4px] bg-neutral-100" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-neutral-100" />
            <div className="h-4 w-1/2 rounded bg-neutral-100" />
            <div className="h-32 rounded-[12px] bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-[20px] font-bold text-neutral-800">E-Book not found</h1>
        <Link href="/courses" className="mt-4 inline-flex items-center gap-1.5 text-[14px] text-primary-500 hover:underline">
          <ArrowLeft size={14} /> Back to courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const currentModule = course.modules.sort((a, b) => a.sortOrder - b.sortOrder)[activeChapter];
  const publisherInitials = course.publisher.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href={`/learn/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-[14px] text-neutral-500 transition-colors hover:text-neutral-800"
      >
        <ArrowLeft size={14} />
        Back to course
      </Link>

      {/* ─── Hero: Book cover + Details ─── */}
      <div className="rounded-[20px] bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Cover */}
          <div className="flex justify-center lg:justify-start">
            <EbookCover title={course.title} />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <div className="mb-3 flex items-center gap-2">
              <ContentTypeBadge type="ebook" size="md" />
            </div>

            <h1
              className="text-[24px] font-bold text-neutral-800 lg:text-[30px]"
              style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              {course.title}
            </h1>

            <p className="mt-1 text-[14px] text-neutral-500">
              by <span className="font-semibold text-neutral-700">{course.publisher.name.toUpperCase()}</span>
            </p>

            <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-neutral-600">
              {course.description?.slice(0, 300)}
            </p>

            {/* Metadata grid */}
            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-neutral-100 pt-5 sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium text-neutral-400">Chapters</p>
                <p className="text-[14px] font-semibold text-neutral-800">{course.modules.length}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-400">Pages</p>
                <p className="text-[14px] font-semibold text-neutral-800">{totalLessons * 12}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-400">Format</p>
                <p className="text-[14px] font-semibold text-neutral-800">Digital PDF</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-400">Language</p>
                <p className="text-[14px] font-semibold text-neutral-800">English</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-md">
                <BookOpen size={16} />
                Start Reading
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700">
                <Bookmark size={16} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content area: TOC + Reading + Reviews ─── */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr_280px]">
        {/* Left: Table of Contents */}
        <div className="hidden lg:block">
          <TableOfContents
            modules={course.modules}
            activeChapter={activeChapter}
            onSelect={setActiveChapter}
          />
        </div>

        {/* Center: Reading area */}
        <div className="rounded-[16px] bg-white p-6 shadow-sm md:p-8">
          {/* Chapter header */}
          <div className="mb-6 border-b border-neutral-100 pb-4">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary-500">
              Chapter {activeChapter + 1} of {course.modules.length}
            </p>
            <h2
              className="text-[22px] font-bold text-neutral-800"
              style={{ letterSpacing: '-0.01em' }}
            >
              {currentModule?.title || 'Introduction'}
            </h2>
          </div>

          {/* Chapter content (simulated) */}
          <div className="prose prose-sm max-w-none text-[14px] leading-[1.8] text-neutral-600">
            <p>
              This chapter covers the foundational concepts you need to understand before
              diving deeper into the material. Each section builds upon the previous one,
              creating a structured learning path that ensures comprehensive understanding.
            </p>
            <p className="mt-4">
              The key principles discussed here form the backbone of the entire course.
              Pay close attention to the examples provided, as they illustrate real-world
              applications of each concept.
            </p>

            {/* Lesson list within chapter */}
            {currentModule && (
              <div className="mt-6 space-y-2">
                {currentModule.lessons
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 rounded-[10px] bg-neutral-50 px-4 py-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-neutral-500 shadow-sm">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-neutral-800">
                          {lesson.title}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {lesson.estimatedReadTimeMinutes} min read
                        </p>
                      </div>
                      <FileText size={14} className="shrink-0 text-neutral-400" />
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-5">
            <button
              onClick={() => setActiveChapter(Math.max(0, activeChapter - 1))}
              disabled={activeChapter === 0}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-800 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Previous Chapter
            </button>
            <button
              onClick={() =>
                setActiveChapter(Math.min(course.modules.length - 1, activeChapter + 1))
              }
              disabled={activeChapter >= course.modules.length - 1}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-500 transition-colors hover:text-primary-600 disabled:opacity-30"
            >
              Next Chapter
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Reviews + related books */}
        <div className="space-y-5">
          {/* Related books sidebar */}
          <div className="rounded-[16px] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-[14px] font-bold text-neutral-800">More E-Books</h3>
            <div className="space-y-3">
              {['Advanced Techniques', 'Design Patterns', 'Case Studies'].map((title, i) => (
                <div key={title} className="flex items-center gap-3 rounded-[10px] p-2 transition-colors hover:bg-neutral-50">
                  <div
                    className="flex h-14 w-10 shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold text-white"
                    style={{
                      background:
                        i === 0
                          ? 'linear-gradient(145deg, #7c2d12 0%, #ea580c 100%)'
                          : i === 1
                            ? 'linear-gradient(145deg, #1e3a5f 0%, #3b82f6 100%)'
                            : 'linear-gradient(145deg, #065f46 0%, #34d399 100%)',
                    }}
                  >
                    <BookOpen size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-neutral-800">{title}</p>
                    <p className="text-[10px] text-neutral-500">CourseCity</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ReviewCard />
        </div>
      </div>
    </div>
  );
}
