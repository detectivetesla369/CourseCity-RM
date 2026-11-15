'use client';

import { useRef } from 'react';
import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { useMotion, gsap, ScrollTrigger } from '@/lib/motion';
import {
  Search,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

/* ─────────────────────── Feature 01: Discover ─────────────────────── */

function DiscoverVisual() {
  return (
    <div className="card !rounded-[28px] !p-5 space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-full border border-egg-deep bg-egg px-4 py-3">
        <Search size={16} className="text-muted" />
        <span className="text-sm text-muted">Search courses...</span>
        <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange text-bottle">
          <SlidersHorizontal size={14} />
        </div>
      </div>
      {/* Filter tags */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All Topics', active: true },
          { label: 'Beginner', active: false },
          { label: 'Design', active: false },
          { label: '< 2 hours', active: false },
        ].map((f) => (
          <span
            key={f.label}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              f.active
                ? 'bg-bottle text-egg'
                : 'bg-egg-deep/40 text-muted'
            }`}
          >
            {f.label}
          </span>
        ))}
      </div>
      {/* Mini results */}
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-egg p-3">
          <div className={`h-12 w-12 rounded-xl ${i === 1 ? 'bg-gradient-to-br from-orange to-orange-deep' : 'bg-gradient-to-br from-blue to-blue/80'}`} />
          <div className="flex-1">
            <div className="h-3 w-28 rounded bg-egg-deep/60" />
            <div className="mt-1.5 h-2.5 w-20 rounded bg-egg-deep/40" />
          </div>
          <ArrowRight size={14} className="text-muted" />
        </div>
      ))}
    </div>
  );
}

function FeatureDiscover() {
  return (
    <section id="features" className="bg-egg py-24 md:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12">
        {/* Text */}
        <div>
          <Reveal variant="left">
            <span className="eyebrow">EXPLORE & DISCOVER</span>
          </Reveal>
          <RevealText
            text={"Find what moves\nyour work *forward.*"}
            mode="word"
            className="t-h2 mt-4"
          />
          <Reveal variant="left" delay={0.2}>
            <p className="t-lead mt-4 max-w-md">
              Search across 150+ courses. Filter by topic, skill level,
              duration, or instructor. Every course is curated and reviewed.
            </p>
          </Reveal>
          <Reveal variant="left" delay={0.35}>
            <a href="#courses" className="btn btn-primary mt-6">
              Browse courses <ArrowRight size={16} />
            </a>
          </Reveal>
        </div>
        {/* Visual */}
        <Reveal variant="right">
          <DiscoverVisual />
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────── Feature 02: Learn ─────────────────────── */

function LearnVisual() {
  return (
    <div className="card !rounded-[28px] !p-4 space-y-3">
      {/* Reader header */}
      <div className="flex items-center gap-2 border-b border-egg-deep/30 pb-2">
        <BookOpen size={14} className="text-orange" />
        <span className="text-xs font-semibold text-bottle">
          Chapter 3: Token Systems
        </span>
        <span className="ml-auto text-xs text-muted">5 min read</span>
      </div>
      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded bg-egg-deep/40" />
        <div className="h-2.5 w-[92%] rounded bg-egg-deep/40" />
        <div className="h-2.5 w-[78%] rounded bg-egg-deep/40" />
      </div>
      {/* Code block */}
      <div className="rounded-xl bg-bottle p-3 space-y-1.5 font-mono">
        <div className="h-2 w-24 rounded bg-orange/40" />
        <div className="h-2 w-36 rounded bg-salad/40" />
        <div className="h-2 w-20 rounded bg-blue/40" />
        <div className="h-2 w-28 rounded bg-egg/20" />
      </div>
      {/* More content */}
      <div className="space-y-2">
        <div className="h-2.5 w-[88%] rounded bg-egg-deep/40" />
        <div className="h-2.5 w-full rounded bg-egg-deep/40" />
      </div>
      {/* Inline quiz */}
      <div className="rounded-xl border border-salad/30 bg-salad-wash/30 p-3 space-y-2">
        <span className="text-xs font-bold text-salad">
          ✓ Knowledge Check
        </span>
        <div className="h-2.5 w-40 rounded bg-salad/20" />
        <div className="flex gap-2">
          {['A', 'B', 'C'].map((o) => (
            <span
              key={o}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-semibold text-muted border border-egg-deep/30"
            >
              {o}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureLearn() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12">
        {/* Visual — left on desktop */}
        <Reveal variant="left" className="order-2 lg:order-1">
          <LearnVisual />
        </Reveal>
        {/* Text — right on desktop */}
        <div className="order-1 lg:order-2">
          <Reveal variant="right">
            <span className="eyebrow">IMMERSIVE LEARNING</span>
          </Reveal>
          <RevealText
            text={"A reader built for\n*deep focus.*"}
            mode="word"
            className="t-h2 mt-4"
          />
          <Reveal variant="right" delay={0.2}>
            <p className="t-lead mt-4 max-w-md">
              Clean, distraction-free reading with inline code editors,
              interactive exercises, LaTeX math support, and instant knowledge
              checks built right into every lesson.
            </p>
          </Reveal>
          <Reveal variant="right" delay={0.35}>
            <a href="#" className="btn btn-accent mt-6">
              See the reader <ArrowRight size={16} />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Feature 03: Progress ─────────────────────── */

function ProgressTrack() {
  const trackRef = useRef<HTMLDivElement>(null);

  useMotion(trackRef, (env) => {
    if (env.reduce) return;
    const el = trackRef.current;
    if (!el) return;

    const line = el.querySelector<HTMLElement>('[data-progress-line]');
    const dots = el.querySelectorAll<HTMLElement>('[data-checkpoint]');
    if (!line) return;

    gsap.fromTo(
      line,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 75%',
          end: 'top 30%',
          scrub: 0.6,
        },
      },
    );

    dots.forEach((dot, i) => {
      gsap.fromTo(
        dot,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(2)',
          scrollTrigger: {
            trigger: el,
            start: `top ${75 - i * 10}%`,
            once: true,
          },
        },
      );
    });
  });

  const checkpoints = ['Enrolled', '50% Complete', 'Assessment Passed', 'Certified'];

  return (
    <div ref={trackRef} className="relative mx-auto mt-16 max-w-3xl">
      {/* Desktop: horizontal track */}
      <div className="hidden md:block">
        {/* Track background */}
        <div className="relative h-1.5 w-full rounded-full bg-egg-deep/40">
          <div
            data-progress-line
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-salad to-salad/80"
          />
        </div>
        {/* Checkpoints */}
        <div className="relative -mt-4 flex justify-between">
          {checkpoints.map((label, i) => (
            <div key={label} data-checkpoint className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-salad text-white shadow-lift-sm">
                <CheckCircle2 size={18} />
              </div>
              <span className="mt-2 text-xs font-semibold text-bottle text-center max-w-[100px]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical track */}
      <div className="flex flex-col gap-6 md:hidden">
        {checkpoints.map((label, i) => (
          <Reveal key={label} variant="up" delay={i * 0.1}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-salad text-white">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-sm font-semibold text-bottle">{label}</span>
              {i < checkpoints.length - 1 && (
                <div className="absolute left-5 top-12 h-6 w-0.5 bg-salad/30" />
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function FeatureProgress() {
  return (
    <section className="bg-egg py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 text-center md:px-8 lg:px-12">
        <Reveal variant="up">
          <span className="eyebrow">TRACK & ACHIEVE</span>
        </Reveal>
        <RevealText
          text={"See how far\nyou've *come.*"}
          mode="word"
          className="t-h2 mt-4"
        />
        <Reveal variant="up" delay={0.2}>
          <p className="t-lead mx-auto mt-4 max-w-xl">
            Follow your journey from enrollment to certification. Lesson
            progress, quiz scores, and completed assignments — all in one
            dashboard.
          </p>
        </Reveal>
        <ProgressTrack />
      </div>
    </section>
  );
}

/* ─────────────────────── Export all three ─────────────────────── */
export { FeatureDiscover, FeatureLearn, FeatureProgress };
