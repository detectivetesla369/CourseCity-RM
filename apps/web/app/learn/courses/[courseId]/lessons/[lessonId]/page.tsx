'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  StickyNote,
  Check,
  ChevronRight,
  Clock,
  Menu,
  X,
  Lightbulb,
  Code2,
  Quote,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { CourseDetailDTO, LessonBlockDTO } from '@coursecity/contracts';

/* ------------------------------------------------------------------ */
/*  Content Block Renderer                                             */
/* ------------------------------------------------------------------ */
function ContentBlock({ block }: { block: LessonBlockDTO }) {
  const content = block.content as Record<string, string>;

  switch (block.blockType) {
    case 'HEADING':
      const level = (content.level || 'h2') as string;
      const Tag = level === 'h1' ? 'h1' : level === 'h3' ? 'h3' : 'h2';
      const sizeClass = level === 'h1' ? 'text-[1.8rem]' : level === 'h3' ? 'text-lg' : 'text-xl';
      return <Tag className={`${sizeClass} font-bold text-bottle mt-10 mb-4`} style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>{content.text}</Tag>;

    case 'PARAGRAPH':
      return <p className="text-[16px] text-bottle/80 leading-[1.75] mb-5">{content.text}</p>;

    case 'IMAGE':
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content.url} alt={content.alt || ''} className="w-full rounded-[16px]" />
          {content.caption && (
            <figcaption className="mt-2 text-center text-xs text-muted">{content.caption}</figcaption>
          )}
        </figure>
      );

    case 'CODE':
      return (
        <pre className="my-6 overflow-x-auto rounded-[16px] bg-[#1e1e1e] p-6 text-[14px] text-egg/90 font-mono leading-relaxed">
          <code>{content.code || content.text}</code>
        </pre>
      );

    case 'CALLOUT':
      return (
        <div className="my-6 rounded-[16px] border-l-4 border-orange bg-orange/5 p-5">
          {content.title && <p className="text-[14px] font-bold text-bottle mb-1.5">{content.title}</p>}
          <p className="text-[14px] text-bottle/70 leading-relaxed">{content.text}</p>
        </div>
      );

    case 'QUOTE':
      return (
        <blockquote className="my-8 border-l-4 border-[#e8dfcf] pl-6 italic text-bottle/55">
          <p className="text-[17px] leading-relaxed">{content.text}</p>
          {content.author && <cite className="mt-3 block text-[13px] not-italic text-muted/50">— {content.author}</cite>}
        </blockquote>
      );

    default:
      return (
        <div className="my-6 rounded-[16px] bg-egg p-5 text-sm text-muted">
          <p>[{block.blockType} block]</p>
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Demo lesson content — shown when API isn't connected               */
/* ------------------------------------------------------------------ */
function DemoLessonContent() {
  return (
    <div>
      <h2 className="text-xl font-bold text-bottle mt-2 mb-4" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        The shape of a system
      </h2>

      <p className="text-[16px] text-bottle/80 leading-[1.75] mb-5">
        A design system is more than a component library or a style guide. It&apos;s a shared language — a set of
        decisions made once so that teams can move faster and with more confidence. Think of it as the grammar behind
        every interface your product builds.
      </p>

      <p className="text-[16px] text-bottle/80 leading-[1.75] mb-5">
        The best systems aren&apos;t rigid. They&apos;re opinionated enough to prevent chaos, but flexible enough
        to let designers and developers make smart, contextual choices. They encode taste — not just rules.
      </p>

      {/* Callout */}
      <div className="my-7 rounded-[16px] bg-orange/5 p-5 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange/10 mt-0.5">
          <Lightbulb size={16} className="text-orange" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-bottle mb-1">Key insight</p>
          <p className="text-[14px] text-bottle/70 leading-relaxed">
            A design token is the smallest meaningful decision in your system. It bridges design intent and
            engineering implementation. When a token changes, every surface that uses it updates automatically.
          </p>
        </div>
      </div>

      {/* Code block */}
      <div className="my-7">
        <div className="flex items-center gap-2 mb-2">
          <Code2 size={14} className="text-muted/40" />
          <span className="text-[11px] font-medium text-muted/40 uppercase tracking-wider">Design tokens example</span>
        </div>
        <pre className="overflow-x-auto rounded-[16px] bg-[#1e1e1e] p-6 text-[14px] text-egg/90 font-mono leading-relaxed">
          <code>{`// tokens.ts
export const color = {
  orange:    '#FF6400',
  bottle:    '#003223',
  egg:       '#F5EBE1',
  salad:     '#8CC850',
};

export const radius = {
  field:  '12px',
  panel:  '20px',
  card:   '28px',
  tile:   '36px',
};`}</code>
        </pre>
      </div>

      <h2 className="text-xl font-bold text-bottle mt-10 mb-4" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Why tokens matter
      </h2>

      <p className="text-[16px] text-bottle/80 leading-[1.75] mb-5">
        Without tokens, teams make hundreds of micro-decisions every day — hex values, spacing numbers,
        border radii. Each one creates a small inconsistency. Over months, these add up to interfaces that
        feel subtly &ldquo;off&rdquo; without anyone being able to say exactly why.
      </p>

      <p className="text-[16px] text-bottle/80 leading-[1.75] mb-5">
        Tokens collapse that decision space. Instead of choosing from infinite values, a designer picks from
        a curated set that&apos;s already been tested and approved. The result is faster work that looks
        more cohesive — not because creativity is limited, but because the right choices are obvious.
      </p>

      {/* Blockquote */}
      <blockquote className="my-8 border-l-4 border-[#e8dfcf] pl-6 italic text-bottle/50">
        <p className="text-[17px] leading-relaxed">
          &ldquo;The goal of a system is not to constrain, but to liberate. When the basics are solved,
          the team can focus on what actually matters — the experience.&rdquo;
        </p>
        <cite className="mt-3 block text-[13px] not-italic text-muted/50">— Nia Okafor, Product Design Lead</cite>
      </blockquote>

      <p className="text-[16px] text-bottle/80 leading-[1.75] mb-5">
        In the next chapter, we&apos;ll build our first set of tokens from scratch — starting with color,
        moving through spacing, and ending with the radius scale that gives every surface its personality.
        Each token will carry a name that communicates intent, not just value.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lesson Sidebar Navigation                                          */
/* ------------------------------------------------------------------ */
function LessonNav({
  course,
  currentLessonId,
  courseId,
  open,
  onClose,
}: {
  course: CourseDetailDTO;
  currentLessonId: string;
  courseId: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-bottle/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-egg border-r border-[#e0d6c8] overflow-y-auto
          transition-transform duration-300
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between border-b border-[#e0d6c8]/60 px-5 py-4">
          <Link
            href={`/learn/courses/${courseId}`}
            className="text-[13px] font-bold text-bottle truncate hover:text-orange-ink transition-colors"
          >
            {course.title}
          </Link>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted/40 hover:text-bottle hover:bg-white/50 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="p-3">
          {course.modules
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((mod, mi) => (
              <div key={mod.id} className="mb-5">
                <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-orange/60">
                  Chapter {mi + 1} · {mod.title}
                </p>
                {mod.lessons
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/courses/${courseId}/lessons/${lesson.id}`}
                        onClick={onClose}
                        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                          isCurrent
                            ? 'bg-white shadow-lift-sm text-orange-ink font-semibold'
                            : lesson.isCompleted
                              ? 'text-muted/50 hover:text-bottle hover:bg-white/40'
                              : 'text-bottle/70 hover:text-bottle hover:bg-white/40'
                        }`}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                          lesson.isCompleted
                            ? 'bg-salad text-white'
                            : isCurrent
                              ? 'bg-orange text-white'
                              : 'bg-bottle/6 text-muted/35'
                        }`}>
                          {lesson.isCompleted ? (
                            <Check size={10} strokeWidth={3} />
                          ) : (
                            <span className="text-[9px] font-bold">{lesson.sortOrder}</span>
                          )}
                        </div>
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                    );
                  })}
              </div>
            ))}
        </nav>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Reading Progress Bar                                                */
/* ------------------------------------------------------------------ */
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const pct = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0;
      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="h-[2px] w-full bg-[#e8dfcf]/50">
      <div
        className="h-full bg-orange transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Lesson Reader Page                                            */
/* ------------------------------------------------------------------ */
export default function LessonPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const { api } = useAuth();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [blocks, setBlocks] = useState<LessonBlockDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    api.getCourseBySlug(courseId)
      .then((data) => {
        setCourse(data);
        // Find current lesson to check completion
        for (const mod of data.modules) {
          const lesson = mod.lessons.find((l) => l.id === lessonId);
          if (lesson) {
            setIsCompleted(!!lesson.isCompleted);
            break;
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // TODO: load lesson content blocks via api.getLessonContent(courseId, lessonId) when available
    // For now, show demo content
  }, [courseId, lessonId, api]);

  // Find current lesson and nav info
  let currentLesson = null as null | { title: string; estimatedReadTimeMinutes: number; slug: string };
  let prevLesson = null as null | { id: string; title: string };
  let nextLesson = null as null | { id: string; title: string };

  if (course) {
    const allLessons = course.modules
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((m) => m.lessons.sort((a, b) => a.sortOrder - b.sortOrder));

    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    if (currentIndex >= 0) {
      currentLesson = allLessons[currentIndex];
      if (currentIndex > 0) prevLesson = allLessons[currentIndex - 1];
      if (currentIndex < allLessons.length - 1) nextLesson = allLessons[currentIndex + 1];
    }
  }

  const handleMarkComplete = async () => {
    try {
      await api.updateProgress({ lessonId, isCompleted: true });
      setIsCompleted(true);
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-[680px] mx-auto px-4 py-10">
        <div className="h-5 w-40 rounded-lg bg-bottle/5" />
        <div className="h-8 w-3/4 rounded-xl bg-bottle/5" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full rounded-lg bg-bottle/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <h2 className="text-lg font-bold text-bottle">Lesson not found</h2>
        <Link href={`/learn/courses/${courseId}`} className="btn btn-primary mt-6 !rounded-xl gap-2 text-sm">
          <ArrowLeft size={16} /> Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar nav */}
      <LessonNav
        course={course}
        currentLessonId={lessonId}
        courseId={courseId}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* Main reading area */}
      <div className="flex-1 min-w-0">
        {/* Reading progress bar */}
        <ReadingProgressBar />

        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e8dfcf]/50 bg-egg/95 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted/40 hover:bg-white/60 hover:text-bottle lg:hidden transition-colors"
              aria-label="Open lesson navigation"
            >
              <Menu size={18} />
            </button>
            <Link
              href={`/learn/courses/${courseId}`}
              className="text-[12px] text-muted/40 hover:text-bottle transition-colors hidden sm:flex items-center gap-1"
            >
              <ArrowLeft size={11} />
              Course overview
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors ${
                isBookmarked ? 'bg-orange/10 text-orange' : 'text-muted/30 hover:text-bottle hover:bg-white/60'
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              title={isBookmarked ? 'Bookmarked' : 'Bookmark this lesson'}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted/30 hover:text-bottle hover:bg-white/60 transition-colors"
              aria-label="Add note"
              title="Add a note"
            >
              <StickyNote size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <article className="mx-auto max-w-[680px] px-5 py-10 lg:px-8 lg:py-14">
          {/* Lesson title */}
          <header className="mb-10">
            <h1
              className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem]"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              {currentLesson.title}
            </h1>
            <div className="mt-4 flex items-center gap-4 text-[13px] text-muted/50">
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {currentLesson.estimatedReadTimeMinutes} min read
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1.5 text-salad font-semibold">
                  <Check size={13} strokeWidth={2.5} />
                  Completed
                </span>
              )}
            </div>
            <div className="mt-5 h-px bg-[#e8dfcf]/60" />
          </header>

          {/* Lesson content blocks */}
          {blocks.length > 0 ? (
            <div className="lesson-content">
              {blocks
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((block) => (
                  <ContentBlock key={block.id} block={block} />
                ))}
            </div>
          ) : (
            /* Demo content when API isn't connected */
            <DemoLessonContent />
          )}

          {/* Mark complete */}
          {!isCompleted ? (
            <div className="mt-14 rounded-[16px] border border-[#e8dfcf] bg-white p-6 text-center">
              <p className="text-[13px] text-muted/50 mb-3">Finished reading?</p>
              <button
                onClick={handleMarkComplete}
                className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white shadow-lift-sm transition-all hover:-translate-y-0.5 hover:shadow-lift-md"
              >
                <Check size={16} strokeWidth={2.5} />
                Mark as completed
              </button>
            </div>
          ) : (
            <div className="mt-14 rounded-[16px] border border-salad/20 bg-salad/5 p-6 text-center">
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-salad/15">
                <Check size={18} className="text-salad" strokeWidth={2.5} />
              </div>
              <p className="text-[14px] font-semibold text-bottle">Lesson completed</p>
              <p className="mt-1 text-[12px] text-muted/50">Nice work. Move to the next lesson when you&apos;re ready.</p>
            </div>
          )}

          {/* Prev / Next navigation */}
          <nav className="mt-10 flex gap-4 border-t border-[#e8dfcf]/50 pt-8">
            {prevLesson ? (
              <Link
                href={`/learn/courses/${courseId}/lessons/${prevLesson.id}`}
                className="group flex flex-1 flex-col items-start rounded-[16px] border border-[#e8dfcf] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift-sm"
              >
                <span className="flex items-center gap-1 text-[11px] text-muted/40">
                  <ArrowLeft size={11} /> Previous
                </span>
                <span className="mt-1.5 text-[13px] font-semibold text-bottle group-hover:text-orange-ink transition-colors line-clamp-1">
                  {prevLesson.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextLesson ? (
              <Link
                href={`/learn/courses/${courseId}/lessons/${nextLesson.id}`}
                className="group flex flex-1 flex-col items-end rounded-[16px] border border-[#e8dfcf] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift-sm"
              >
                <span className="flex items-center gap-1 text-[11px] text-muted/40">
                  Next <ArrowRight size={11} />
                </span>
                <span className="mt-1.5 text-[13px] font-semibold text-bottle group-hover:text-orange-ink transition-colors line-clamp-1">
                  {nextLesson.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
