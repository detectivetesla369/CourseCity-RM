'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BookOpen, Award, Users, ArrowLeft } from 'lucide-react';

/* Code-split the Three.js scene — no SSR, lazy-loads only on desktop. */
const AuthScene = dynamic(() => import('./AuthScene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Shared split layout for every auth screen:
 * 3D scene panel on the left (desktop), form column on the right.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ─── Left panel: 3D scene + overlay ─── */}
      <div
        className="sticky top-0 hidden h-screen w-[52%] shrink-0 self-start overflow-hidden lg:block"
        style={{
          background:
            'radial-gradient(110% 75% at 100% 0%, rgba(255,100,0,0.22) 0%, rgba(255,100,0,0.06) 38%, rgba(255,100,0,0) 60%), linear-gradient(165deg, #001a12 0%, #002a1c 35%, #00382a 70%, #0a1f18 100%)',
          borderTopRightRadius: 'clamp(32px, 4vw, 64px)',
          borderBottomRightRadius: 'clamp(32px, 4vw, 64px)',
        }}
      >
        {/* Three.js canvas (fills the panel) */}
        <AuthScene />

        {/* HTML overlay — copy top-left, proof bottom-left, the dial owns the middle */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <div>
            <div className="pointer-events-auto flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange text-lg font-bold text-white shadow-[0_4px_16px_rgba(255,100,0,0.3)]">
                CC
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                CourseCity
              </span>
            </div>

            <h2
              className="mt-10 text-4xl font-extrabold leading-tight tracking-tight text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Learn something<br />that actually sticks.
            </h2>
            <p className="mt-4 max-w-sm text-base text-white/60">
              Structured courses, expert instructors, and credentials that prove it.
            </p>
          </div>

          {/* Bottom: trust stats */}
          <div className="pointer-events-auto flex gap-8">
            {[
              { icon: BookOpen, value: '150+', label: 'Courses', color: '#FF6400' },
              { icon: Award, value: '2.8k', label: 'Certificates', color: '#8CC850' },
              { icon: Users, value: '18k+', label: 'Learners', color: '#1F6FD6' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label}>
                <div
                  className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm"
                  style={{ backgroundColor: `${color}25`, border: `1px solid ${color}30` }}
                >
                  <Icon size={18} style={{ color: `${color}cc` }} />
                </div>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right panel: form column ─── */}
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #fefcfa 0%, #f5ebe1 50%, #fef5ee 100%)' }}
      >
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #FF640030 0%, transparent 70%)' }}
          />
          <div
            className="absolute -left-16 bottom-24 h-48 w-48 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #1F6FD620 0%, transparent 70%)' }}
          />
          <div
            className="absolute right-12 bottom-0 h-40 w-40 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #8CC85020 0%, transparent 70%)' }}
          />
        </div>

        {/* Accent top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #FF6400 0%, #ff8a3d 35%, #8CC850 70%, #1F6FD6 100%)' }} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-bottle/60 transition-colors hover:text-bottle"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange text-sm font-bold text-white">
              CC
            </div>
            <span className="text-lg font-bold tracking-tight text-bottle">CourseCity</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12 md:px-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** "or" divider between Google and the email form. */
export function AuthDivider({ label = 'or continue with email' }: { label?: string }) {
  return (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #FF640025 30%, #8CC85025 70%, transparent 100%)' }} />
      </div>
      <div className="relative flex justify-center">
        <span className="px-4 text-xs font-medium text-bottle/40" style={{ backgroundColor: '#f8f0e8' }}>{label}</span>
      </div>
    </div>
  );
}

/** Terms line shared by sign-in and sign-up. */
export function AuthTerms({ action }: { action: string }) {
  return (
    <p className="mt-8 text-center text-xs text-muted/70 leading-relaxed">
      By {action}, you agree to CourseCity&apos;s{' '}
      <a href="#" className="font-medium text-bottle underline underline-offset-2 hover:text-orange-ink">
        Terms of Service
      </a>{' '}
      and{' '}
      <a href="#" className="font-medium text-bottle underline underline-offset-2 hover:text-orange-ink">
        Privacy Policy
      </a>
      .
    </p>
  );
}
