'use client';

import { useEffect, useCallback, useRef } from 'react';

interface OnboardingSplashProps {
  /** Called when the splash finishes (auto-advance or user skip). */
  onDone: () => void;
  /** Optional first name from the Google profile. */
  name?: string;
}

const AUTO_ADVANCE_MS = 2600;
const REDUCED_MOTION_MS = 900;

/**
 * Branded welcome splash shown once, right after Google sign-in.
 * Auto-advances, but any click or keypress skips it — the user is never trapped.
 */
export function OnboardingSplash({ onDone, name }: OnboardingSplashProps) {
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(finish, reduce ? REDUCED_MOTION_MS : AUTO_ADVANCE_MS);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return; // don't hijack focus navigation
      finish();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  return (
    <div
      role="dialog"
      aria-label="Welcome to CourseCity"
      onClick={finish}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: 'linear-gradient(175deg, #e04f00 0%, #ff6400 40%, #ff7a1f 100%)' }}
    >
      {/* Skyline silhouette — the "city" in CourseCity */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] w-full animate-[splash-rise_1.1s_cubic-bezier(0.22,1,0.36,1)_both]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <path
          d="M0 320V210h70v-40h50v60h40V140h80v90h30V90h90v140h40v-70h60v70h30V60h100v170h40v-90h70v90h30V120h80v110h40v-50h60v50h30V80h90v150h40v-60h70v60h40V150h80v80h50v-40h60v130z"
          fill="rgba(0,50,35,0.14)"
        />
        <path
          d="M0 320v-60h110v-50h60v50h70v-80h90v80h60v-40h80v40h70v-110h100v110h60v-60h80v60h70v-90h90v90h60v-50h80v50h70v-70h90v70h80v130z"
          fill="rgba(0,50,35,0.22)"
        />
      </svg>

      {/* Logo mark */}
      <div className="relative animate-[splash-rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-2xl font-extrabold text-orange shadow-[0_12px_32px_rgba(110,30,0,0.3)]">
          CC
        </div>
      </div>

      <p
        className="relative mt-8 text-sm font-semibold uppercase tracking-[0.08em] text-bottle/70 animate-[splash-rise_0.7s_0.15s_cubic-bezier(0.22,1,0.36,1)_both]"
      >
        {name ? `Welcome, ${name}` : 'Welcome to CourseCity'}
      </p>

      <h1
        className="relative mt-3 max-w-xl text-4xl font-extrabold leading-[1.02] text-white md:text-6xl animate-[splash-rise_0.8s_0.25s_cubic-bezier(0.22,1,0.36,1)_both]"
        style={{ letterSpacing: '-0.04em' }}
      >
        Let&apos;s map out
        <br />
        your city.
      </h1>

      <p className="relative mt-4 max-w-sm text-base text-white/75 animate-[splash-rise_0.8s_0.35s_cubic-bezier(0.22,1,0.36,1)_both]">
        Three quick questions so we can point you to the right streets.
      </p>

      {/* Progress-to-continue bar: shows the user how long the splash lasts */}
      <div className="relative mt-10 h-1 w-40 overflow-hidden rounded-full bg-white/25">
        <div
          className="absolute inset-0 origin-left rounded-full bg-white"
          style={{ animation: `splash-bar ${AUTO_ADVANCE_MS}ms linear both` }}
        />
      </div>

      <p className="relative mt-4 text-xs font-medium text-white/60">
        Click or press any key to continue
      </p>
    </div>
  );
}
