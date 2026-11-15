'use client';

import { createElement, useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap, useMotion, scaled } from '@/lib/motion';

type Variant = 'up' | 'left' | 'right' | 'scale';

/** HTML-only on purpose: @react-three/fiber adds three.js tags to JSX.IntrinsicElements. */
type RevealTag = 'div' | 'section' | 'article' | 'header' | 'footer' | 'span' | 'p' | 'ul' | 'li';

interface RevealProps {
  children: ReactNode;
  as?: RevealTag;
  variant?: Variant;
  delay?: number;
  /** Animate descendants marked [data-reveal-item] with a stagger instead of the wrapper. */
  group?: boolean;
  stagger?: number;
  start?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** Level-1 text/element reveal: opacity + short translate (or scale for tiles). */
export function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  group = false,
  stagger = 0.1,
  start = 'top 86%',
  className,
  style,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, (env) => {
    if (env.reduce) return;
    const el = ref.current;
    if (!el) return;
    const targets = group ? Array.from(el.querySelectorAll('[data-reveal-item]')) : [el];
    if (!targets.length) return;

    const d = scaled(env, 48, 0.5);
    const from: gsap.TweenVars =
      variant === 'left'
        ? { x: -d * 1.2 }
        : variant === 'right'
          ? { x: d * 1.2 }
          : variant === 'scale'
            ? { scale: 0.94, y: d * 0.6 }
            : { y: d };

    gsap.fromTo(
      targets,
      { opacity: 0, ...from },
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        delay,
        stagger: group ? stagger : 0,
        // Hand transforms back to CSS afterwards so hover lifts keep working.
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start, once: true },
      },
    );
  });

  return createElement(
    Tag,
    { ref, id, className, style, ...(group ? {} : { 'data-anim': '' }) },
    children,
  );
}
