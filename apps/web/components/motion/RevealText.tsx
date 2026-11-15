'use client';

import { createElement, useRef, type CSSProperties } from 'react';
import { gsap, useMotion, scaled } from '@/lib/motion';

export type RevealMode = 'line' | 'word' | 'char';

interface Token {
  word: string;
  accent: boolean;
}

/**
 * Tiny markup: "\n" starts a new line, *text* marks accent (italic, brand tint).
 * "Courses that\n*move you*\nforward." -> 3 lines, middle one accented.
 */
function parse(text: string): Token[][] {
  return text.split('\n').map((line) => {
    const tokens: Token[] = [];
    let accent = false;
    let buffer = '';
    const flush = () => {
      if (buffer) {
        tokens.push({ word: buffer, accent });
        buffer = '';
      }
    };
    for (const ch of line) {
      if (ch === '*') {
        flush();
        accent = !accent;
      } else if (ch === ' ') {
        flush();
      } else {
        buffer += ch;
      }
    }
    flush();
    return tokens;
  });
}

interface RevealTextProps {
  text: string;
  /** HTML-only on purpose: @react-three/fiber adds three.js tags to JSX.IntrinsicElements. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span';
  /** line: everyday headings · word: section/hero statements · char: final statements only */
  mode?: RevealMode;
  className?: string;
  style?: CSSProperties;
  /** Play on mount instead of when scrolled into view (hero). */
  immediate?: boolean;
  delay?: number;
  stagger?: number;
}

export function RevealText({
  text,
  as: Tag = 'h2',
  mode = 'line',
  className,
  style,
  immediate = false,
  delay = 0,
  stagger,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const lines = parse(text);
  const label = lines.map((l) => l.map((t) => t.word).join(' ')).join(' ');

  useMotion(ref, (env) => {
    if (env.reduce) return;
    const el = ref.current;
    if (!el) return;
    const units = el.querySelectorAll('[data-u]');
    if (!units.length) return;

    let from: gsap.TweenVars;
    if (mode === 'line') {
      from = { yPercent: 110, opacity: 0 };
    } else if (mode === 'word') {
      from = { yPercent: 110, opacity: 0, filter: 'blur(4px)' };
    } else {
      from = {
        y: scaled(env, 30),
        rotateX: 60,
        opacity: 0,
        transformPerspective: 600,
        transformOrigin: '50% 100%',
      };
    }

    const to: gsap.TweenVars = {
      yPercent: 0,
      y: 0,
      rotateX: 0,
      opacity: 1,
      duration: mode === 'line' ? 1 : mode === 'word' ? 0.9 : 0.8,
      ease: 'power3.out',
      stagger: stagger ?? (mode === 'char' ? 0.022 : mode === 'word' ? 0.07 : 0.12),
      delay,
      clearProps: mode === 'line' ? undefined : 'filter',
    };
    if (mode === 'word') to.filter = 'blur(0px)';
    if (!immediate) {
      to.scrollTrigger = { trigger: el, start: 'top 88%', once: true };
    }

    gsap.fromTo(units, from, to);
  });

  // The visible text is split into aria-hidden spans; the real text lives in aria-label.
  return createElement(
    Tag,
    { ref, className, style, 'aria-label': label, 'data-split': mode },
    lines.map((tokens, li) => {
        if (mode === 'line') {
          return (
            <span key={li} className="mask-line" aria-hidden="true">
              <span data-u className="block">
                {tokens.map((t, i) => (
                  <span key={i} className={t.accent ? 'accent' : undefined}>
                    {t.word}
                    {i < tokens.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
            </span>
          );
        }

        return (
          <span key={li} className="block" aria-hidden="true">
            {tokens.map((t, i) =>
              mode === 'word' ? (
                <span key={i}>
                  <span className="mask-word">
                    <span data-u className={`inline-block${t.accent ? ' accent' : ''}`}>
                      {t.word}
                    </span>
                  </span>{' '}
                </span>
              ) : (
                <span key={i}>
                  <span className="inline-block whitespace-nowrap">
                    {[...t.word].map((c, ci) => (
                      <span key={ci} data-u className={`inline-block${t.accent ? ' accent' : ''}`}>
                        {c}
                      </span>
                    ))}
                  </span>{' '}
                </span>
              ),
            )}
          </span>
        );
      }),
  );
}
