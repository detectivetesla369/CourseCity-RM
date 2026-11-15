'use client';

import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowUpRight } from 'lucide-react';

function BentoGrid() {
  return (
    <Reveal group stagger={0.1} className="mt-16">
      {/*
        Grid layout matching the reference:
        ┌──────────┬──────────┬──────────┐
        │          │  74%     │  2,840   │
        │  120+    │  white   │  green   │
        │  blue    ├──────────┴──────────┤
        │  (tall)  │   18k+  dark wide   │
        └──────────┴─────────────────────┘
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-[auto_auto]">
        {/* ── Tile 1: Blue tall tile (spans 2 rows) ── */}
        <div
          data-reveal-item
          className="row-span-1 sm:row-span-2 flex flex-col justify-between rounded-card bg-gradient-to-br from-blue to-blue/80 p-7 min-h-[320px]"
        >
          {/* Avatars */}
          <div className="flex -space-x-2.5">
            {[
              { initials: 'SC', bg: '#FF6400' },
              { initials: 'MR', bg: '#E65300' },
              { initials: 'JA', bg: '#8CC850' },
            ].map((a) => (
              <div
                key={a.initials}
                className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-blue text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: a.bg }}
              >
                {a.initials}
              </div>
            ))}
          </div>

          {/* Big number */}
          <div className="mt-auto">
            <p className="text-6xl font-extrabold text-white leading-none tracking-tight">
              120+
            </p>
            <p className="mt-3 text-[15px] text-white/80 leading-relaxed max-w-[200px]">
              Expert instructors publishing courses on CourseCity.
            </p>
          </div>

          {/* Bottom link */}
          <a
            href="#"
            className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 hover:text-white transition-colors"
          >
            Meet the teachers <ArrowUpRight size={13} />
          </a>
        </div>

        {/* ── Tile 2: White tile (74%) ── */}
        <div
          data-reveal-item
          className="flex flex-col justify-between rounded-card bg-white p-7 min-h-[200px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <span className="eyebrow text-blue">
            COMMITMENT TO PRACTICE
          </span>

          <div className="mt-4">
            <p className="text-5xl font-extrabold text-bottle leading-none tracking-tight">
              74%
            </p>
            <p className="mt-3 text-[14px] text-muted leading-relaxed">
              of learners return to a course within the same week.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-5 h-[6px] w-full rounded-full bg-egg-deep/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue to-blue/70"
              style={{ width: '74%' }}
            />
          </div>
        </div>

        {/* ── Tile 3: Green tile (2,840) ── */}
        <div
          data-reveal-item
          className="flex flex-col justify-between rounded-card bg-salad-wash p-7 min-h-[200px]"
        >
          <span className="eyebrow text-bottle/60">
            LESSONS PUBLISHED
          </span>

          <div className="mt-4">
            <p className="text-5xl font-extrabold text-bottle leading-none tracking-tight">
              2,840
            </p>
            <p className="mt-3 text-[14px] text-bottle/70 leading-relaxed">
              lessons across design, code, research, data, and the work around them.
            </p>
          </div>

          <a
            href="#"
            className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-bottle/80 hover:text-bottle transition-colors"
          >
            Browse categories <ArrowUpRight size={13} />
          </a>
        </div>

        {/* ── Tile 4: Dark wide tile (18k+) — spans center + right columns ── */}
        <div
          data-reveal-item
          className="sm:col-span-2 flex items-center gap-5 rounded-card bg-bottle px-7 py-5"
        >
          <span className="eyebrow text-egg/40">
            ACTIVE THIS WEEK
          </span>
          <p className="text-4xl font-extrabold text-egg leading-none tracking-tight">
            18k+
          </p>
          <span className="text-[14px] text-egg/50">
            curious minds
          </span>
        </div>
      </div>
    </Reveal>
  );
}

export function EditorialStatement() {
  return (
    <section id="about" className="bg-egg py-24 md:py-32 lg:py-40">
      <div className="mx-auto max-w-[1000px] px-5 md:px-8 lg:px-12">
        {/* ── Centered heading block ── */}
        <div className="text-center">
          <Reveal variant="up">
            <span className="eyebrow">ABOUT COURSECITY</span>
          </Reveal>

          <RevealText
            text={"A learning place for people\nbuilding *better things.*"}
            mode="word"
            className="t-h2 mt-5"
          />

          <Reveal variant="up" delay={0.3}>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted leading-relaxed">
              More than a course catalogue. CourseCity brings together expert
              instructors, structured learning paths, and verifiable credentials
              so you can invest in skills that actually matter.
            </p>
          </Reveal>

          <Reveal variant="up" delay={0.45}>
            <a
              href="#courses"
              className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue hover:text-blue/80 transition-colors"
            >
              Explore the catalogue <ArrowUpRight size={14} />
            </a>
          </Reveal>
        </div>

        {/* ── Bento Grid ── */}
        <BentoGrid />
      </div>
    </section>
  );
}
