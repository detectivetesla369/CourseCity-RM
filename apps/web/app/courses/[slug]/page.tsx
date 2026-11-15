'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Heart,
  Star,
  Users,
  Lock,
  Eye,
  Play,
  ShoppingCart,
  Sparkles,
  Check,
  Loader2,
  Award,
  Layers,
} from 'lucide-react';
import type { CourseDetailDTO } from '@coursecity/contracts';
import { ApiClientError } from '@coursecity/api-client';
import { useAuth } from '@/lib/auth-context';
import ContentTypeBadge, {
  getCourseContentTypeById,
} from '@/components/learn/ContentTypeBadge';

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-5 w-32 rounded-lg bg-bottle/5" />
      <div className="rounded-[20px] bg-white p-8">
        <div className="flex gap-8">
          <div className="h-80 w-96 rounded-[16px] bg-bottle/5" />
          <div className="flex-1 space-y-4">
            <div className="h-4 w-40 rounded bg-bottle/5" />
            <div className="h-12 w-full rounded-xl bg-bottle/5" />
            <div className="h-12 w-3/4 rounded-xl bg-bottle/5" />
            <div className="h-20 w-full rounded-xl bg-bottle/5" />
            <div className="h-12 w-48 rounded-2xl bg-bottle/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cover illustration — stacked layers icon matching prototype        */
/* ------------------------------------------------------------------ */
function CoverIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom layer */}
      <rect x="20" y="70" width="80" height="12" rx="4" fill="rgba(0,50,35,0.12)" />
      {/* Middle layer */}
      <rect x="25" y="55" width="70" height="12" rx="4" fill="rgba(0,50,35,0.18)" />
      {/* Top layer */}
      <rect x="30" y="40" width="60" height="12" rx="4" fill="rgba(0,50,35,0.25)" />
      {/* Decorative top shape */}
      <path d="M48 30 L60 20 L72 30" stroke="rgba(0,50,35,0.2)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Curriculum Chapter Row                                              */
/* ------------------------------------------------------------------ */
function ChapterRow({
  module,
  index,
  isInProgress,
}: {
  module: CourseDetailDTO['modules'][0];
  index: number;
  isInProgress?: boolean;
}) {
  const totalMins = module.lessons.reduce((s, l) => s + l.estimatedReadTimeMinutes, 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const durationLabel = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins} min`;

  return (
    <div
      className={`flex items-center gap-4 rounded-xl px-5 py-4 transition-colors ${
        isInProgress
          ? 'bg-orange/5 border border-orange/15'
          : 'hover:bg-egg/60'
      }`}
    >
      {/* Chapter number */}
      <span className={`text-[14px] font-bold tabular-nums ${isInProgress ? 'text-orange' : 'text-muted/30'}`}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-bold ${isInProgress ? 'text-orange-ink' : 'text-bottle'}`}>
          {module.title}
        </p>
        <p className={`text-[12px] ${isInProgress ? 'text-orange/60' : 'text-muted/50'}`}>
          {isInProgress ? 'In progress' : `${module.lessons.length} lessons`}
        </p>
      </div>

      {/* Duration + action */}
      <span className="text-[12px] text-muted/40 tabular-nums">{durationLabel}</span>
      {isInProgress ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange text-white">
          <Play size={12} fill="white" />
        </div>
      ) : (
        <ChevronRight size={15} className="text-muted/25" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, api, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    api
      .getCourseBySlug(slug)
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.problem.detail : 'Course not found.');
        setLoading(false);
      });
  }, [slug, api]);

  const handleEnrollFree = async () => {
    if (!course || !isAuthenticated) {
      router.push(`/auth/signin?returnTo=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }
    setEnrolling(true);
    try {
      await api.enrollFree(course.id);
      router.push(`/learn/courses/${course.id}`);
    } catch {
      setEnrolling(false);
    }
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?returnTo=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }
    router.push(`/courses/${slug}/checkout`);
  };

  if (loading) return <DetailSkeleton />;

  if (error || !course) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-bottle">Course not found</h1>
        <p className="mt-2 text-sm text-muted">{error || "The course you're looking for doesn't exist."}</p>
        <Link href="/courses" className="btn btn-primary mt-8 gap-2">
          <ArrowLeft size={16} />
          Back to catalogue
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const hours = Math.floor(course.estimatedDurationMinutes / 60);
  const mins = course.estimatedDurationMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  const publisherInitials = course.publisher.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Learning outcomes (static for prototype, would come from API)
  const outcomes = [
    'Translate messy ideas into clear, reusable patterns.',
    'Create tokens that make the right choice feel obvious.',
    'Document decisions without slowing the team down.',
  ];

  // Audience tags
  const audienceTags = ['Product people', 'Designers', 'Team leads'];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/courses"
        className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-muted/55 hover:text-bottle transition-colors"
      >
        <ChevronRight size={14} className="rotate-180" />
        Back to courses
      </Link>

      {/* ─── Hero: wrapped in white card like prototype ─── */}
      <div className="rounded-[20px] bg-white p-7 md:p-9">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* Large cover — warm peach/salmon gradient matching prototype */}
          <div
            className="relative flex h-72 items-center justify-center overflow-hidden rounded-[16px] lg:h-[340px]"
            style={{ background: 'linear-gradient(145deg, #f5c5a3 0%, #f0b08a 40%, #e8a07a 100%)' }}
          >
            {course.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.coverImageUrl} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <CoverIllustration />
            )}
            {/* Label bottom-left — matches prototype */}
            <div className="absolute bottom-4 left-5 text-[9px] font-semibold uppercase tracking-[0.15em] text-bottle/30">
              CourseCity / Course 014
            </div>
          </div>

          {/* Info column */}
          <div className="flex flex-col justify-center">
            {/* Meta badges */}
            <div className="mb-3 flex items-center gap-2.5 text-[13px]">
              <ContentTypeBadge type={getCourseContentTypeById(course.id)} size="md" />
              <span className="text-muted/30">·</span>
              <span className="rounded-md bg-orange/10 px-2.5 py-1 font-bold uppercase text-orange-ink tracking-wide text-[11px]">
                Design
              </span>
              <span className="text-muted/30">·</span>
              <span className="font-medium text-muted/55">
                {course.level === 'ALL_LEVELS' ? 'All levels' : course.level.charAt(0) + course.level.slice(1).toLowerCase()}
              </span>
              <span className="text-muted/30">·</span>
              <span className="font-medium text-muted/55">{durationLabel}</span>
            </div>

            {/* Title — very large, tight tracking, matching prototype */}
            <h1
              className="text-[2.2rem] font-extrabold text-bottle md:text-[2.8rem] leading-[1.05]"
              style={{ letterSpacing: '-0.035em' }}
            >
              {course.title}
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-lg text-[15px] leading-[1.7] text-muted/65">
              {course.description?.slice(0, 200)}
              {(course.description?.length || 0) > 200 ? '…' : ''}
            </p>

            {/* Publisher row */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bottle/6 text-[12px] font-bold text-bottle">
                  {publisherInitials}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-bottle">Created by {course.publisher.name}</p>
                  <p className="text-[12px] text-muted/50">
                    {course.publisher.type === 'INSTRUCTOR' ? 'Product designer at Arc' : 'Publisher'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[14px]">
                <Star size={15} className="fill-orange text-orange" />
                <span className="font-semibold text-bottle">4.9</span>
                <span className="text-muted/40">(2.4k)</span>
              </div>
            </div>

            {/* CTA buttons — matching prototype exactly */}
            <div className="mt-7 flex items-center gap-3">
              {course.isEnrolled ? (
                <Link
                  href={`/learn/courses/${course.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[15px] font-semibold text-white shadow-lift-sm transition-all hover:-translate-y-0.5 hover:shadow-lift-md"
                >
                  <Play size={17} fill="white" />
                  Continue course
                </Link>
              ) : course.isFree ? (
                <button
                  onClick={handleEnrollFree}
                  disabled={enrolling}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[15px] font-semibold text-white shadow-lift-sm transition-all hover:-translate-y-0.5 hover:shadow-lift-md disabled:opacity-60"
                >
                  {enrolling ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Enrolling…
                    </>
                  ) : (
                    <>
                      <Play size={17} fill="white" />
                      Start course
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[15px] font-semibold text-white shadow-lift-sm transition-all hover:-translate-y-0.5 hover:shadow-lift-md"
                >
                  <Play size={17} fill="white" />
                  Start course
                </button>
              )}
              <button className="inline-flex items-center gap-2 rounded-full border-2 border-bottle/8 px-5 py-3 text-[15px] font-medium text-bottle transition-colors hover:border-bottle/20">
                <Heart size={17} />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Below the fold ─── */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Left: Content */}
        <div>
          {/* Subtitle / tagline */}
          <h2
            className="text-[1.6rem] font-bold text-bottle md:text-[1.9rem]"
            style={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}
          >
            A system with a point of view
          </h2>
          <p className="mt-2.5 text-[15px] text-muted/55 leading-relaxed">
            Six short chapters, each ending with something you can use in your next project.
          </p>

          {/* Learning outcomes — in a row like prototype */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-8">
            {outcomes.map((outcome) => (
              <div key={outcome} className="flex items-start gap-2.5 max-w-xs">
                <Check size={16} className="mt-0.5 shrink-0 text-salad" strokeWidth={2.5} />
                <span className="text-[14px] text-bottle/75 leading-snug">{outcome}</span>
              </div>
            ))}
          </div>

          {/* ─── Curriculum ─── */}
          <div className="mt-14">
            <p className="eyebrow mb-1.5">The route</p>
            <div className="mb-5 flex items-center justify-between">
              <h2
                className="text-[1.5rem] font-bold text-bottle"
                style={{ letterSpacing: '-0.015em' }}
              >
                Course curriculum
              </h2>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted/35">
                {course.modules.length} chapters · {totalLessons} lessons
              </span>
            </div>

            <div className="space-y-0.5">
              {course.modules
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((mod, i) => (
                  <ChapterRow
                    key={mod.id}
                    module={mod}
                    index={i}
                    isInProgress={i === 1 && course.isEnrolled}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* ─── Right sidebar cards ─── */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Personality card — matches prototype "You like the messy middle" */}
          <div className="rounded-[20px] bg-white p-6 shadow-lift-sm">
            <h3
              className="text-[1.3rem] font-bold text-bottle md:text-[1.5rem]"
              style={{ letterSpacing: '-0.025em', lineHeight: 1.2 }}
            >
              You like the<br />messy middle.
            </h3>
            <p className="mt-3 text-[14px] text-muted/55 leading-relaxed">
              You have a point of view, but your team needs a shared language to see it too.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {audienceTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-bottle/8 px-3 py-1.5 text-[12px] font-medium text-bottle/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Course notes card — matches prototype with icon stats */}
          <div className="rounded-[20px] bg-white p-6 shadow-lift-sm">
            <p className="eyebrow mb-5">Course notes</p>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3.5">
                <BookOpen size={18} className="text-orange" strokeWidth={1.8} />
                <div>
                  <span className="text-[1.7rem] font-extrabold text-bottle" style={{ letterSpacing: '-0.03em' }}>
                    {totalLessons}
                  </span>
                  <span className="ml-2 text-[13px] text-muted/50">lessons</span>
                </div>
              </div>
              <div className="h-px bg-[#e8dfcf]/50" />
              <div className="flex items-center gap-3.5">
                <Award size={18} className="text-orange" strokeWidth={1.8} />
                <div>
                  <span className="text-[1.7rem] font-extrabold text-bottle" style={{ letterSpacing: '-0.03em' }}>
                    1
                  </span>
                  <span className="ml-2 text-[13px] text-muted/50">certificate</span>
                </div>
              </div>
              <div className="h-px bg-[#e8dfcf]/50" />
              <div className="flex items-center gap-3.5">
                <Users size={18} className="text-orange" strokeWidth={1.8} />
                <div>
                  <span className="text-[1.7rem] font-extrabold text-bottle" style={{ letterSpacing: '-0.03em' }}>
                    2.4k
                  </span>
                  <span className="ml-2 text-[13px] text-muted/50">learners</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
