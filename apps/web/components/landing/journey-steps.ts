import {
  BookOpen,
  ClipboardCheck,
  Compass,
  Flag,
  KeyRound,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type JourneyKind = 'start' | 'step' | 'target';

export interface JourneyStep {
  id: string;
  kind: JourneyKind;
  /** Small uppercase marker above the title. */
  tag: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  /** Marker colour (brand palette). */
  color: string;
  /** Icon colour on top of `color` (always >= 4.5:1). */
  ink: string;
}

/**
 * The learner's path through CourseCity, from first click to certificate.
 * Start and target are first-class points so the route reads as a journey,
 * not a feature list.
 */
export const JOURNEY: readonly JourneyStep[] = [
  {
    id: 'start',
    kind: 'start',
    tag: 'Start here',
    title: 'Choose your path',
    desc: 'Pick the category that matches where you want to go.',
    icon: Flag,
    color: '#8cc850',
    ink: '#003223',
  },
  {
    id: 'find',
    kind: 'step',
    tag: '01',
    title: 'Find your fit',
    desc: 'Compare outlines and levels to land on the right course.',
    icon: Compass,
    color: '#1f6fd6',
    ink: '#ffffff',
  },
  {
    id: 'enroll',
    kind: 'step',
    tag: '02',
    title: 'Enroll & unlock',
    desc: 'Get instant access once your payment is verified.',
    icon: KeyRound,
    color: '#ff6400',
    ink: '#003223',
  },
  {
    id: 'learn',
    kind: 'step',
    tag: '03',
    title: 'Build real skills',
    desc: 'Work through lessons, exercises and knowledge checks.',
    icon: BookOpen,
    color: '#003223',
    ink: '#f5ebe1',
  },
  {
    id: 'prove',
    kind: 'step',
    tag: '04',
    title: 'Prove it',
    desc: 'Pass quizzes and assignments to show what you know.',
    icon: ClipboardCheck,
    color: '#1f6fd6',
    ink: '#ffffff',
  },
  {
    id: 'target',
    kind: 'target',
    tag: 'Your target',
    title: 'Get certified',
    desc: 'Earn a certificate anyone can verify instantly.',
    icon: Target,
    color: '#ff6400',
    ink: '#003223',
  },
] as const;

/**
 * Scroll progress (0–1) at which each point is reached. The chain line is
 * drawn between consecutive thresholds, so the two always stay in sync.
 */
export const JOURNEY_THRESHOLDS: readonly number[] = JOURNEY.map(
  (_, i) => 0.04 + (i / (JOURNEY.length - 1)) * 0.86,
);

/** Back-out easing for the "pop" (slight overshoot, then settle). */
export function popEase(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const t = Math.min(Math.max(x, 0), 1) - 1;
  return 1 + c3 * t * t * t + c1 * t * t;
}
