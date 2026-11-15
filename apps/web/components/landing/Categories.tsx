'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { useMotion, gsap, ScrollTrigger, MEDIA } from '@/lib/motion';
import { useMediaQuery } from '@/lib/use-media-query';
import { JourneyFlat } from './JourneyFlat';

/* WebGL journey is desktop-only and loaded on demand. */
const JourneyScene = dynamic(() => import('./JourneyScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

/** Scroll distance (px) the stage stays pinned while the journey plays. */
const PIN_DISTANCE = 1500;

export function Categories() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /** 0 → 1 journey progress, read every frame by the 3D scene. */
  const progress = useRef(0);
  const show3D = useMediaQuery(MEDIA.desktop);

  useMotion(sectionRef, (env) => {
    const stage = stageRef.current;
    if (!stage) return;

    /* Desktop: pin the 3D stage and scrub the journey with scroll.
       Scrolling back up retraces it (points hide, chain retracts). */
    if (env.desktop) {
      const pin = ScrollTrigger.create({
        trigger: stage,
        start: 'center center',
        end: `+=${PIN_DISTANCE}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });

      // Progress scrubs from ~0.09 (first marker fully popped) to 1.
      // The starting offset means the start-flag is visible as soon as
      // the section enters view — the user doesn't scroll into emptiness.
      const SEED = 0.1; // enough to fully pop marker 0
      ScrollTrigger.create({
        trigger: stage,
        start: 'top 85%',
        end: () => pin.end,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.current = SEED + self.progress * (1 - SEED);
        },
        onLeave: () => {
          progress.current = 1;
        },
        onLeaveBack: () => {
          progress.current = 0;
        },
      });
      return;
    }

    /* Mobile: chain draws with scroll, points pop in one by one. */
    if (env.mobile) {
      const chain = stage.querySelector('[data-journey-chain]');
      if (chain) {
        gsap.fromTo(
          chain,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: stage, start: 'top 70%', end: 'bottom 70%', scrub: 0.5 },
          },
        );
      }

      stage.querySelectorAll<HTMLElement>('[data-journey-item]').forEach((item) => {
        const node = item.querySelector('[data-journey-node]');
        const card = item.querySelector('[data-journey-card]');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: item, start: 'top 78%', toggleActions: 'play none none reverse' },
        });
        if (node) tl.from(node, { scale: 0, duration: 0.5, ease: 'back.out(2.2)' });
        if (card) tl.from(card, { autoAlpha: 0, x: 18, duration: 0.45, ease: 'power3.out' }, '-=0.25');
      });
    }
  });

  /* The stage switches from the flat list to the 3D canvas after hydration;
     re-measure so the pin and every trigger below it use the final height. */
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [show3D]);

  return (
    <section ref={sectionRef} className="bg-white py-24 md:py-32 lg:py-40 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
        <div className="mb-12 text-center">
          <Reveal variant="up">
            <span className="eyebrow">COURSE CATEGORIES</span>
          </Reveal>
          <RevealText
            text={"Every path has\na *starting point.*"}
            mode="word"
            className="t-h2 mt-4"
          />
        </div>

        {/* Journey stage */}
        <div ref={stageRef} className={show3D ? 'relative h-[min(680px,84vh)] w-full' : 'relative'}>
          {show3D ? <JourneyScene progress={progress} /> : <JourneyFlat />}
        </div>
      </div>
    </section>
  );
}
