'use client';

import { useRef } from 'react';
import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { useMotion, gsap, scaled } from '@/lib/motion';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Subtle parallax: content drifts up as user scrolls past */
  useMotion(sectionRef, (env) => {
    if (env.reduce) return;
    const el = sectionRef.current;
    if (!el) return;

    const content = el.querySelector<HTMLElement>('[data-hero-content]');
    if (content) {
      gsap.to(content, {
        y: () => scaled(env, 60),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }
  });

  return (
    <section ref={sectionRef} className="hero on-orange relative overflow-hidden">
      <div
        data-hero-content
        className="relative mx-auto max-w-[1400px] px-5 pt-36 pb-32 md:px-8 md:pt-44 md:pb-40 lg:px-12 lg:pt-52 lg:pb-48"
      >
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <Reveal variant="up" delay={0}>
            <span className="eyebrow text-bottle/70">A LEARNING CITY FOR CURIOUS PEOPLE</span>
          </Reveal>

          {/* Main heading */}
          <RevealText
            text={"Learn something\nthat *actually sticks.*"}
            as="h1"
            mode="word"
            className="t-display mt-6 text-white"
            immediate
          />

          {/* Subheading */}
          <Reveal variant="up" delay={0.4}>
            <p className="t-lead mx-auto mt-6 max-w-lg text-white/75">
              Structured courses, expert instructors, and credentials that prove it — all in one place.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal variant="up" delay={0.6}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="#courses" className="btn btn-primary">
                Find your next course
                <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" className="btn btn-light">
                <BookOpen size={18} />
                See how it works
              </a>
            </div>
          </Reveal>

          {/* Trust badges */}
          <Reveal variant="up" delay={0.8}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-white/60">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-salad/30">
                  <Sparkles size={12} className="text-salad" />
                </span>
                150+ courses
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-salad/30">
                  <Sparkles size={12} className="text-salad" />
                </span>
                Verified certificates
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-salad/30">
                  <Sparkles size={12} className="text-salad" />
                </span>
                Secure receipts
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
