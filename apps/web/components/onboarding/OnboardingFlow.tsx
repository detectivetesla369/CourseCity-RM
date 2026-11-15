'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { StepProgress } from './StepProgress';
import { StepGoals } from './StepGoals';
import { StepRole } from './StepRole';
import { StepTopics } from './StepTopics';
import { StepReady } from './StepReady';
import { OnboardingSplash } from './OnboardingSplash';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TOTAL_STEPS = 4;

type Direction = 'forward' | 'backward';

export function OnboardingFlow() {
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<Direction>('forward');
  const [animKey, setAnimKey] = useState(0);

  /* Answers state */
  const [goal, setGoal] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [topics, setTopics] = useState<Set<string>>(new Set());

  const contentRef = useRef<HTMLDivElement>(null);

  /* Navigate steps */
  const goNext = useCallback(() => {
    if (step >= TOTAL_STEPS) return;
    setDirection('forward');
    setAnimKey((k) => k + 1);
    setStep((s) => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step <= 1) return;
    setDirection('backward');
    setAnimKey((k) => k + 1);
    setStep((s) => s - 1);
  }, [step]);

  /* Can proceed? */
  const canProceed = (() => {
    switch (step) {
      case 1: return goal !== null;
      case 2: return role !== null;
      case 3: return topics.size > 0;
      default: return false;
    }
  })();

  /* Keyboard shortcuts */
  useEffect(() => {
    if (showSplash) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canProceed && step < TOTAL_STEPS) {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'Escape' && step > 1) {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSplash, canProceed, step, goNext, goBack]);

  /* Scroll to top on step change */
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  /* Topic toggle */
  const toggleTopic = useCallback((id: string) => {
    setTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* Finish onboarding */
  const handleFinish = useCallback(() => {
    // TODO: Save preferences to API, then redirect
    window.location.href = '/';
  }, []);

  /* Render current step */
  const renderStep = (): ReactNode => {
    switch (step) {
      case 1: return <StepGoals selected={goal} onSelect={setGoal} />;
      case 2: return <StepRole selected={role} onSelect={setRole} />;
      case 3: return <StepTopics selected={topics} onToggle={toggleTopic} />;
      case 4: return <StepReady onFinish={handleFinish} />;
      default: return null;
    }
  };

  /* Animation class based on direction */
  const slideClass = direction === 'forward'
    ? 'animate-[slide-in-right_0.4s_cubic-bezier(0.22,1,0.36,1)_both]'
    : 'animate-[slide-in-left_0.4s_cubic-bezier(0.22,1,0.36,1)_both]';

  return (
    <div className="flex min-h-screen flex-col">
      {showSplash && <OnboardingSplash onDone={() => setShowSplash(false)} />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange text-sm font-bold text-white">
            CC
          </div>
          <span className="text-lg font-bold tracking-tight text-bottle">CourseCity</span>
        </Link>

        {step < TOTAL_STEPS && (
          <button
            type="button"
            onClick={handleFinish}
            className="text-sm font-medium text-muted transition-colors hover:text-bottle"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Main content */}
      <div ref={contentRef} className="flex flex-1 flex-col items-center justify-center px-6 pb-8 md:px-10">
        <div className="w-full max-w-[640px]">
          {/* Progress */}
          {step < TOTAL_STEPS && (
            <div className="mb-10">
              <StepProgress current={step} total={TOTAL_STEPS - 1} />
            </div>
          )}

          {/* Step content with transition */}
          <div key={animKey} className={slideClass}>
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      {step < TOTAL_STEPS && (
        <div className="flex items-center justify-between border-t border-bottle/5 px-6 py-4 md:px-10">
          <button
            type="button"
            onClick={goBack}
            disabled={step <= 1}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-bottle transition-all hover:bg-egg disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Keyboard hint */}
            <span className="hidden text-xs text-muted/50 md:block">
              Press <kbd className="rounded border border-bottle/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold">Enter ↵</kbd>
            </span>

            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="flex items-center gap-2 rounded-xl bg-bottle px-6 py-2.5 text-sm font-bold text-egg transition-all hover:bg-bottle-soft disabled:opacity-30 disabled:pointer-events-none active:scale-[0.97]"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
