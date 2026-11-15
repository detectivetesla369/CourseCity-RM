'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Check,
  Play,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { CourseDetailDTO } from '@coursecity/contracts';
import ContentTypeBadge from '@/components/learn/ContentTypeBadge';

/* ─── New design system components ─── */
import InstructorHeader from '@/components/learn/InstructorHeader';
import CourseAchievements from '@/components/learn/CourseAchievements';
import VideoPlayer from '@/components/learn/VideoPlayer';
import QuickChat from '@/components/learn/QuickChat';
import NowWatching from '@/components/learn/NowWatching';

/* ------------------------------------------------------------------ */
/*  Lesson List — proper spacing, touch targets, proximity grouping    */
/* ------------------------------------------------------------------ */
function LessonList({
  modules,
  courseId,
  totalDurationMinutes,
}: {
  modules: CourseDetailDTO['modules'];
  courseId: string;
  totalDurationMinutes: number;
}) {
  const wholeMins = Math.floor(totalDurationMinutes);
  const secs = Math.round((totalDurationMinutes % 1) * 60);

  const allLessons = modules
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((mod) =>
      mod.lessons.sort((a, b) => a.sortOrder - b.sortOrder),
    );

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h3 className="text-[16px] text-neutral-600">
          Course <span className="font-bold text-neutral-800">Details</span>
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Clock size={12} />
          <span>{wholeMins} min{secs > 0 ? `, ${secs} sec` : ''}</span>
        </div>
      </div>

      <div className="space-y-1">
        {allLessons.map((lesson, idx) => {
          const number = idx + 1;
          const isCompleted = lesson.isCompleted;
          const isCurrent = !isCompleted && (idx === 0 || allLessons[idx - 1]?.isCompleted);

          return (
            <Link
              key={lesson.id}
              href={`/learn/courses/${courseId}/lessons/${lesson.id}`}
              className="group flex items-center gap-3 rounded-[12px] px-3 py-3 transition-colors duration-100 hover:bg-neutral-50"
              style={{ minHeight: '44px' }}
            >
              {/* Number / check circle */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                  isCompleted
                    ? 'bg-success-light text-success'
                    : isCurrent
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-150 text-neutral-400'
                }`}
              >
                {isCompleted ? <Check size={13} strokeWidth={3} /> : number}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] leading-snug ${
                  isCompleted ? 'text-neutral-400' : 'font-medium text-neutral-800'
                }`}>
                  {lesson.title}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {lesson.estimatedReadTimeMinutes} min
                </p>
              </div>

              {/* Action */}
              <button
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-100 ${
                  isCurrent
                    ? 'bg-primary-50 text-primary-500 hover:bg-primary-500 hover:text-white'
                    : 'text-neutral-300 group-hover:text-neutral-500'
                }`}
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                {isCurrent ? <Play size={11} className="translate-x-[1px]" /> : <Plus size={13} />}
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */
function CourseDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-neutral-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-[6px] bg-neutral-200" />
              <div className="h-3 w-20 rounded-[6px] bg-neutral-200" />
            </div>
          </div>
          <div className="h-7 w-3/4 rounded-[6px] bg-neutral-200" />
          <div className="h-16 rounded-[8px] bg-neutral-200" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 rounded-[12px] bg-neutral-200" />
            <div className="h-24 rounded-[12px] bg-neutral-200" />
            <div className="h-24 rounded-[12px] bg-neutral-200" />
          </div>
        </div>
        <div className="aspect-video rounded-[16px] bg-neutral-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-[16px] bg-neutral-200" />
        <div className="h-64 rounded-[16px] bg-neutral-200" />
        <div className="h-64 rounded-[16px] bg-neutral-200" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function LearnCourseOverviewPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { api } = useAuth();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    api.getCourseBySlug(courseId)
      .then(setCourse)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [courseId, api]);

  if (loading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <h2 className="text-[16px] font-bold text-neutral-800">Course not found</h2>
        <p className="mt-1 text-[13px] text-neutral-500">We couldn&apos;t load this course.</p>
        <Link href="/learn/library" className="btn btn-primary mt-6 gap-2">
          <ArrowLeft size={16} /> Back to library
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isCompleted).length,
    0,
  );
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ─── Top: Info + Video (32px gap) ─── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left — course info with proper spacing */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ContentTypeBadge type="video" size="md" />
          </div>
          <InstructorHeader name={course.publisher.name} />

          <div>
            <h1
              className="text-[20px] font-bold text-neutral-800 lg:text-[24px]"
              style={{ letterSpacing: '-0.015em', lineHeight: 1.2 }}
            >
              {course.title}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
              {course.description}
            </p>
          </div>

          <CourseAchievements
            points={1800}
            completionPercent={progress || 45}
            levelUps={26}
          />
        </div>

        {/* Right — video player */}
        <div>
          <VideoPlayer />
        </div>
      </div>

      {/* ─── Bottom: Details + Chat + Watching (24px gap) ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[16px] bg-white p-5 shadow-sm">
          <LessonList
            modules={course.modules}
            courseId={courseId}
            totalDurationMinutes={course.estimatedDurationMinutes}
          />
        </div>
        <QuickChat />
        <NowWatching count={88} />
      </div>
    </div>
  );
}
