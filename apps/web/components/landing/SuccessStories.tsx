'use client';

import { useRef } from 'react';
import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { useMotion, gsap } from '@/lib/motion';
import { ArrowRight, Quote, TrendingUp, Sparkles } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface QuoteStory {
  kind: 'quote';
  name: string;
  role: string;
  course: string;
  quote: string;
  accent: string;   // Tailwind bg class
  accentText: string;
}

interface MetricStory {
  kind: 'metric';
  name: string;
  role: string;
  course: string;
  metric: string;
  context: string;
  accent: string;
  accentText: string;
}

interface JourneyStory {
  kind: 'journey';
  name: string;
  course: string;
  before: string;
  after: string;
  months: number;
}

type Story = QuoteStory | MetricStory | JourneyStory;

const STORIES: Story[] = [
  {
    kind: 'quote',
    name: 'Aisha M.',
    role: 'UX Designer at Figma',
    course: 'Design Systems',
    quote: 'I went from copying Dribbble shots to building a token system my whole team now ships with.',
    accent: 'bg-orange',
    accentText: 'text-white',
  },
  {
    kind: 'metric',
    name: 'Carlos R.',
    role: 'Frontend Engineer',
    course: 'Creative Coding',
    metric: '3×',
    context: 'more interview callbacks after adding course projects to his portfolio',
    accent: 'bg-blue',
    accentText: 'text-white',
  },
  {
    kind: 'journey',
    name: 'Priya K.',
    course: 'Writing for the Web',
    before: 'Marketing intern writing blog posts nobody read',
    after: 'Content strategist leading a 4-person team',
    months: 8,
  },
  {
    kind: 'quote',
    name: 'James L.',
    role: 'Data Analyst → Data Lead',
    course: 'Data Visualization',
    quote: 'My manager said the dashboard I built after this course changed how the entire department makes decisions.',
    accent: 'bg-salad',
    accentText: 'text-bottle',
  },
  {
    kind: 'metric',
    name: 'Sofia T.',
    role: 'Freelance Designer',
    course: 'Modern Typography',
    metric: '$12k',
    context: 'in new client contracts within 4 months of completing the course',
    accent: 'bg-bottle',
    accentText: 'text-egg',
  },
  {
    kind: 'journey',
    name: 'Daniel W.',
    course: 'Field Notes',
    before: 'Junior researcher unsure how to present findings',
    after: 'Published two peer-reviewed papers, promoted to Senior Researcher',
    months: 14,
  },
];

/* ------------------------------------------------------------------ */
/*  Card components                                                    */
/* ------------------------------------------------------------------ */

function QuoteCard({ story }: { story: QuoteStory }) {
  return (
    <div className="group rounded-card bg-white p-6 shadow-lift-md transition-all duration-500 hover:shadow-lift-lg hover:-translate-y-1">
      {/* Accent quote mark */}
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${story.accent} ${story.accentText} mb-4`}>
        <Quote size={18} />
      </div>

      {/* Quote */}
      <blockquote className="text-lg font-semibold leading-snug text-bottle tracking-tight">
        &ldquo;{story.quote}&rdquo;
      </blockquote>

      {/* Attribution */}
      <div className="mt-5 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${story.accent} ${story.accentText} text-xs font-bold`}>
          {story.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-bold text-bottle">{story.name}</p>
          <p className="text-xs text-muted">{story.role}</p>
        </div>
      </div>

      {/* Course badge */}
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-egg px-3 py-1.5 text-xs font-semibold text-bottle/70">
        <Sparkles size={11} className="text-orange" />
        {story.course}
      </div>
    </div>
  );
}

function MetricCard({ story }: { story: MetricStory }) {
  return (
    <div className={`group rounded-card p-6 shadow-lift-md transition-all duration-500 hover:shadow-lift-lg hover:-translate-y-1 ${story.accent}`}>
      {/* Big metric */}
      <p className={`text-5xl font-extrabold leading-none tracking-tight ${story.accentText}`}>
        {story.metric}
      </p>
      <p className={`mt-3 text-sm leading-relaxed ${story.accentText} opacity-80`}>
        {story.context}
      </p>

      {/* Divider */}
      <div className={`my-5 h-px ${story.accentText} opacity-15`} />

      {/* Attribution */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-bold ${story.accentText}`}>{story.name}</p>
          <p className={`text-xs ${story.accentText} opacity-60`}>{story.role}</p>
        </div>
        <span className={`rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold ${story.accentText}`}>
          {story.course}
        </span>
      </div>
    </div>
  );
}

function JourneyCard({ story }: { story: JourneyStory }) {
  return (
    <div className="group rounded-card border-2 border-egg-deep bg-egg p-6 transition-all duration-500 hover:border-orange/30 hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-semibold text-orange-ink">
        <TrendingUp size={14} className="text-orange" />
        {story.months}-month transformation
      </div>

      {/* Before */}
      <div className="mt-4">
        <span className="eyebrow text-muted text-[10px]">BEFORE</span>
        <p className="mt-1 text-sm text-muted leading-relaxed">{story.before}</p>
      </div>

      {/* Arrow connector */}
      <div className="my-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-egg-deep to-orange/40" />
        <ArrowRight size={14} className="text-orange shrink-0" />
        <div className="h-px flex-1 bg-gradient-to-r from-orange/40 to-salad/40" />
      </div>

      {/* After */}
      <div>
        <span className="eyebrow text-salad text-[10px]">AFTER</span>
        <p className="mt-1 text-sm font-semibold text-bottle leading-relaxed">{story.after}</p>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-bold text-bottle">{story.name}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-bottle/70 shadow-lift-sm">
          <Sparkles size={11} className="text-orange" />
          {story.course}
        </span>
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  switch (story.kind) {
    case 'quote':
      return <QuoteCard story={story} />;
    case 'metric':
      return <MetricCard story={story} />;
    case 'journey':
      return <JourneyCard story={story} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export function SuccessStories() {
  const sectionRef = useRef<HTMLElement>(null);

  useMotion(sectionRef, (env) => {
    if (env.reduce) return;
    const el = sectionRef.current;
    if (!el) return;

    const cards = el.querySelectorAll<HTMLElement>('[data-story-card]');
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: i * 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            once: true,
          },
        },
      );
    });
  });

  /* Split stories into two columns for the offset grid */
  const left = STORIES.filter((_, i) => i % 2 === 0);
  const right = STORIES.filter((_, i) => i % 2 === 1);

  return (
    <section ref={sectionRef} className="bg-white py-24 md:py-32 lg:py-40 overflow-hidden">
      <div className="mx-auto max-w-[1100px] px-5 md:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <Reveal variant="up">
            <span className="eyebrow">STORIES FROM THE CITY</span>
          </Reveal>
          <RevealText
            text={"Real learners,\nreal *momentum.*"}
            mode="word"
            className="t-h2 mt-4"
          />
          <Reveal variant="up" delay={0.3}>
            <p className="t-lead mx-auto mt-4 max-w-md">
              Every story started with a single course.
            </p>
          </Reveal>
        </div>

        {/* Staggered two-column grid — right column offset down */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-5 md:gap-6">
            {left.map((story) => (
              <div key={story.name} data-story-card>
                <StoryCard story={story} />
              </div>
            ))}
          </div>

          {/* Right column — offset down on desktop for staggered look */}
          <div className="flex flex-col gap-5 md:gap-6 md:pt-12">
            {right.map((story) => (
              <div key={story.name} data-story-card>
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
