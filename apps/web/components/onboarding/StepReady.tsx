'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface StepReadyProps {
  onFinish: () => void;
}

export function StepReady({ onFinish }: StepReadyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Confetti-style dots animation on mount */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const colors = ['#FF6400', '#8CC850', '#1F6FD6', '#003223', '#FFB37A'];
    const dots: HTMLSpanElement[] = [];

    for (let i = 0; i < 30; i++) {
      const dot = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 140;
      dot.style.cssText = `
        position: absolute;
        width: ${4 + Math.random() * 8}px;
        height: ${4 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%;
        top: 40px;
        opacity: 0;
        pointer-events: none;
        --dx: ${Math.cos(angle) * dist}px;
        --dy: ${Math.sin(angle) * dist - 40}px;
        --rot: ${Math.random() * 540 - 270}deg;
        animation: confetti-burst 1.3s ${i * 0.02}s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      `;
      el.appendChild(dot);
      dots.push(dot);
    }

    return () => {
      dots.forEach((d) => d.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative text-center">
      {/* Celebration icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-orange to-orange-deep shadow-[0_8px_24px_rgba(255,100,0,0.3)]">
        <Sparkles size={36} className="text-white" />
      </div>

      <h1 className="mt-8 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
        You&apos;re all set!
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-base text-muted leading-relaxed">
        We&apos;ve tailored your experience. Time to explore courses built for the way you learn.
      </p>

      <button
        type="button"
        onClick={onFinish}
        className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-bottle px-8 py-4 text-base font-bold text-egg shadow-[0_4px_16px_rgba(0,50,35,0.2)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(0,50,35,0.3)] hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-orange"
      >
        Enter CourseCity
        <ArrowRight size={18} />
      </button>

      <p className="mt-4 text-xs text-muted/60">
        You can update your preferences anytime in Settings.
      </p>
    </div>
  );
}
