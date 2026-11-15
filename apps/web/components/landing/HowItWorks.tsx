'use client';

import { useRef } from 'react';
import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { useMotion, gsap, ScrollTrigger } from '@/lib/motion';
import {
  Search,
  UserPlus,
  BookOpen,
  Code,
  Award,
} from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Discover',
    desc: 'Browse courses across design, development, research, and creative practice. Find what sparks your curiosity.',
    color: 'from-orange to-orange-deep',
    iconBg: 'bg-orange',
  },
  {
    icon: UserPlus,
    title: 'Enroll',
    desc: 'Purchase a course or enroll for free. Your payment is securely verified before access is granted.',
    color: 'from-blue to-blue/80',
    iconBg: 'bg-blue',
  },
  {
    icon: BookOpen,
    title: 'Learn',
    desc: 'Read focused ebook tutorials with inline exercises, code blocks, and knowledge checks.',
    color: 'from-salad to-salad/70',
    iconBg: 'bg-salad',
  },
  {
    icon: Code,
    title: 'Practice',
    desc: 'Take quizzes, submit assignments, and prove your understanding through real challenges.',
    color: 'from-orange to-orange-deep',
    iconBg: 'bg-orange',
  },
  {
    icon: Award,
    title: 'Achieve',
    desc: 'Complete your course and earn a digitally signed certificate that anyone can verify instantly.',
    color: 'from-bottle to-bottle-soft',
    iconBg: 'bg-bottle',
  },
] as const;

/**
 * Generates the winding SVG path that connects all step nodes.
 * The path snakes left→right→left in smooth bezier curves.
 */
function buildPath(
  width: number,
  stepCount: number,
  stepSpacing: number,
  curveInset: number,
): string {
  const parts: string[] = [];
  const startY = 0;
  const leftX = curveInset;
  const rightX = width - curveInset;

  for (let i = 0; i < stepCount; i++) {
    const y = startY + i * stepSpacing;
    const nextY = y + stepSpacing;
    const isEven = i % 2 === 0;

    // Anchor points: steps alternate left/right
    const nodeX = isEven ? leftX : rightX;
    const nextNodeX = isEven ? rightX : leftX;

    if (i === 0) {
      parts.push(`M ${nodeX} ${y}`);
    }

    if (i < stepCount - 1) {
      // Bezier curve to next step
      const cp1x = nodeX;
      const cp1y = y + stepSpacing * 0.55;
      const cp2x = nextNodeX;
      const cp2y = nextY - stepSpacing * 0.55;
      parts.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextNodeX} ${nextY}`);
    }
  }

  return parts.join(' ');
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathBgRef = useRef<SVGPathElement>(null);
  const pathFillRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const arrowRef = useRef<SVGPolygonElement>(null);

  const STEP_SPACING = 260;
  const SVG_HEIGHT = (STEPS.length - 1) * STEP_SPACING;

  /**
   * Compute the path string from the section's current width and write it
   * directly onto both SVG path elements. Returns the new total length so
   * the caller can set up / refresh the dash animation.
   */
  function computePath(): number {
    const section = sectionRef.current;
    const pathBg = pathBgRef.current;
    const pathFill = pathFillRef.current;
    if (!section || !pathBg || !pathFill) return 0;

    const w = Math.min(section.clientWidth, 700);
    const inset = w * 0.18;
    const d = buildPath(w, STEPS.length, STEP_SPACING, inset);
    pathBg.setAttribute('d', d);
    pathFill.setAttribute('d', d);
    return pathFill.getTotalLength();
  }

  /* Scroll-driven path fill + step activation */
  useMotion(sectionRef, (env) => {
    if (env.reduce) return;
    const section = sectionRef.current;
    const pathFill = pathFillRef.current;
    const pathBg = pathBgRef.current;
    const dot = dotRef.current;
    const arrow = arrowRef.current;
    if (!section || !pathFill || !pathBg) return;

    // Compute path immediately — no rAF needed because useMotion runs in
    // useLayoutEffect, and the SVG is always in the DOM (not conditional).
    let totalLen = computePath();
    if (!totalLen) return;

    gsap.set(pathFill, {
      strokeDasharray: totalLen,
      strokeDashoffset: totalLen,
    });

    const stepsContainer = section.querySelector('[data-steps]');
    const stepEls = section.querySelectorAll<HTMLElement>('[data-step]');

    // Re-measure the path on resize so the animation stays in sync.
    const ro = new ResizeObserver(() => {
      const newLen = computePath();
      if (newLen && newLen !== totalLen) {
        totalLen = newLen;
        gsap.set(pathFill, { strokeDasharray: totalLen });
        ScrollTrigger.refresh();
      }
    });
    ro.observe(section);

    // ── Path-fill tween: a real GSAP tween linked with `scrub` so it
    //    plays forward AND reverses automatically on scroll-up.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stepsContainer,
        start: 'top 70%',
        end: 'bottom 40%',
        scrub: 0.3,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Move leading dot along path
          if (dot) {
            const point = pathFill.getPointAtLength(totalLen * progress);
            gsap.set(dot, { cx: point.x, cy: point.y });
          }

          // Move arrowhead
          if (arrow) {
            const p = Math.min(progress + 0.01, 1);
            const point = pathFill.getPointAtLength(totalLen * progress);
            const ahead = pathFill.getPointAtLength(totalLen * p);
            const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * (180 / Math.PI);
            const size = 10;
            const tip = `${point.x + Math.cos(angle * Math.PI / 180) * size},${point.y + Math.sin(angle * Math.PI / 180) * size}`;
            const left = `${point.x + Math.cos((angle + 140) * Math.PI / 180) * size},${point.y + Math.sin((angle + 140) * Math.PI / 180) * size}`;
            const right = `${point.x + Math.cos((angle - 140) * Math.PI / 180) * size},${point.y + Math.sin((angle - 140) * Math.PI / 180) * size}`;
            gsap.set(arrow, { attr: { points: `${tip} ${left} ${right}` } });
          }

          // Activate / deactivate steps based on progress
          const stepProgress = progress * (STEPS.length - 1);
          stepEls.forEach((el, i) => {
            el.classList.toggle('is-active', stepProgress >= i - 0.3);
          });
        },
      },
    });

    // The tween itself: dash offset goes from full (hidden) → 0 (fully drawn).
    // Because it lives on a scrub-linked timeline, GSAP reverses it on scroll-up.
    tl.fromTo(
      pathFill,
      { strokeDashoffset: totalLen },
      { strokeDashoffset: 0, ease: 'none' },
    );

    // Cleanup the ResizeObserver when the GSAP context reverts.
    return () => ro.disconnect();
  });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative bg-white py-20 md:py-28 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-16 text-center">
          <Reveal variant="up">
            <span className="eyebrow">HOW COURSECITY WORKS</span>
          </Reveal>
          <RevealText
            text={"Five steps to\n*real mastery.*"}
            mode="word"
            className="t-h2 mt-4"
          />
          <Reveal variant="up" delay={0.2}>
            <p className="t-lead mx-auto mt-4 max-w-md">
              A clear path from curiosity to certification.
            </p>
          </Reveal>
        </div>

        {/* Path + Steps container */}
        <div
          data-steps
          className="relative mx-auto"
          style={{ maxWidth: '700px', height: `${SVG_HEIGHT}px` }}
        >
          {/* SVG winding path — always in the DOM so refs are stable for useMotion.
              The `d` attribute is set imperatively by computePath(). */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox={`0 0 700 ${SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            aria-hidden="true"
          >
            {/* Background track */}
            <path
              ref={pathBgRef}
              stroke="var(--color-egg-deep)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="12 8"
              opacity="0.5"
            />
            {/* Fill track (animated) */}
            <path
              ref={pathFillRef}
              stroke="var(--color-orange)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Leading dot */}
            <circle
              ref={dotRef}
              r="10"
              fill="var(--color-orange)"
              className="drop-shadow-md"
            />
            {/* Arrowhead */}
            <polygon
              ref={arrowRef}
              fill="var(--color-orange)"
              points="0,0 0,0 0,0"
            />
          </svg>

          {/* Step nodes */}
          {STEPS.map((step, i) => {
            const isEven = i % 2 === 0;
            const Icon = step.icon;
            const y = i * STEP_SPACING;

            return (
              <div
                key={step.title}
                data-step
                className="how-step-card absolute flex items-center gap-5 transition-all duration-500"
                style={{
                  top: `${y - 40}px`,
                  ...(isEven
                    ? { left: 0, flexDirection: 'row-reverse', textAlign: 'right' }
                    : { right: 0, flexDirection: 'row', textAlign: 'left' }),
                  maxWidth: '320px',
                }}
              >
                {/* Icon circle */}
                <div className="relative shrink-0">
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-egg text-[11px] font-bold text-bottle shadow-lift-sm border-2 border-white">
                    {i + 1}
                  </div>
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg transition-transform duration-500`}
                  >
                    <Icon size={28} className="text-white" strokeWidth={1.8} />
                  </div>
                </div>

                {/* Text */}
                <div className="transition-opacity duration-500">
                  <h3 className="text-lg font-bold text-bottle">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
