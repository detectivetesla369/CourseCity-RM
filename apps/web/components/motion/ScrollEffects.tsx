'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, useMotion } from '@/lib/motion';

/** 3px page-reading progress line (CourseCity orange on an eggshell track). */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useMotion(bar, () => {
    const el = bar.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        gsap.set(el, { scaleX: self.progress });
      },
    });
    return () => st.kill();
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-egg/70"
    >
      <div ref={bar} className="h-full origin-left scale-x-0 bg-orange" />
    </div>
  );
}

/**
 * Global scroll effects that don't belong to a single section:
 *  - subtle velocity skew on [data-skew] headings (max ±1.5°, settles instantly)
 *  - ScrollTrigger refresh once fonts/images settle so pins measure correctly
 */
export function ScrollFX() {
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if ('fonts' in document) {
      void document.fonts.ready.then(refresh);
    }
    window.addEventListener('load', refresh);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const targets = gsap.utils.toArray<HTMLElement>('[data-skew]');
      const setters = targets.map((t) =>
        gsap.quickTo(t, 'skewX', { duration: 0.6, ease: 'power3.out' }),
      );
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-1.5, 1.5, self.getVelocity() / -900);
          setters.forEach((set) => set(v));
        },
      });
      const settle = () => setters.forEach((set) => set(0));
      ScrollTrigger.addEventListener('scrollEnd', settle);
      return () => {
        ScrollTrigger.removeEventListener('scrollEnd', settle);
        st.kill();
        gsap.set(targets, { clearProps: 'skewX' });
      };
    });

    return () => {
      window.removeEventListener('load', refresh);
      mm.revert();
    };
  }, []);

  return null;
}
