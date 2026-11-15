'use client';

import { useEffect, useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/**
 * Motion environments. Every section declares its choreography once and the
 * hook below hands it the right environment:
 *  - desktop: full choreography (>=1024px, motion allowed)
 *  - mobile:  shorter travel, fewer layers, no pinning (<1024px, motion allowed)
 *  - reduce:  prefers-reduced-motion -> callers should render the settled state
 */
export interface MotionEnv {
  desktop: boolean;
  mobile: boolean;
  reduce: boolean;
}

export const MEDIA = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Scales a desktop travel distance down for touch / tablet layouts. */
export function scaled(env: MotionEnv, desktopValue: number, mobileFactor = 0.3): number {
  return env.desktop ? desktopValue : desktopValue * mobileFactor;
}

/**
 * Each section owns exactly one scoped GSAP context. Everything created inside
 * `setup` (tweens, ScrollTriggers, pins) is reverted automatically on unmount
 * or when the media environment changes, so nothing leaks between sections.
 */
export function useMotion(
  scope: RefObject<HTMLElement | null>,
  setup: (env: MotionEnv) => void | (() => void),
): void {
  useIsoLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;

    const mm = gsap.matchMedia(el);
    mm.add(MEDIA, (ctx) => {
      const c = (ctx.conditions ?? {}) as Record<string, boolean>;
      return setup({
        desktop: Boolean(c.desktop),
        mobile: Boolean(c.mobile),
        reduce: Boolean(c.reduce),
      });
    });

    return () => mm.revert();
  }, [scope]);
}
