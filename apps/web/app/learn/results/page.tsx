'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Award, BookOpen, Target } from 'lucide-react';

export default function ResultsPage() {
  const [results] = useState<unknown[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Your record</p>
        <h1
          className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem] leading-[1.05]"
          style={{ letterSpacing: '-0.02em' }}
        >
          Results &amp; Grades
        </h1>
        <p className="mt-1 text-[14px] text-muted/60">
          Quiz scores, assignment grades, and examination results.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1">
        {[
          { label: 'All', active: true },
          { label: 'Quizzes', active: false },
          { label: 'Assignments', active: false },
          { label: 'Exams', active: false },
        ].map(({ label, active }) => (
          <button
            key={label}
            className={`rounded-xl px-3.5 py-2 text-[14px] font-medium transition-colors ${
              active ? 'bg-bottle text-egg' : 'text-muted hover:bg-white hover:text-bottle'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="rounded-[28px] bg-white p-8 shadow-lift-sm">
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-wash">
              <Target size={24} className="text-blue" />
            </div>
            <h2 className="text-[1.2rem] font-bold text-bottle">No results yet</h2>
            <p className="mt-2 max-w-sm text-[14px] text-muted/55 leading-relaxed">
              When you complete quizzes, submit assignments, or take examinations,
              your scores and grades will appear here.
            </p>

            {/* Preview illustration */}
            <div className="mt-8 w-full max-w-md space-y-2">
              {[
                { type: 'Quiz', title: 'Chapter 3 — Assessment', grade: '85%', iconBg: 'bg-salad/10', icon: Award, iconColor: 'text-salad', gradeBg: 'bg-salad/10 text-bottle' },
                { type: 'Assignment', title: 'Research Brief', grade: 'B+', iconBg: 'bg-blue-wash', icon: BookOpen, iconColor: 'text-blue', gradeBg: 'bg-blue-wash text-blue' },
                { type: 'Exam', title: 'Final Examination', grade: 'Pending', iconBg: 'bg-orange/8', icon: ClipboardList, iconColor: 'text-orange', gradeBg: 'bg-orange/8 text-orange-ink' },
              ].map(({ type, title, grade, iconBg, icon: Icon, iconColor, gradeBg }) => (
                <div
                  key={type}
                  className="flex items-center gap-3 rounded-xl bg-egg/50 p-3.5 opacity-50"
                  aria-hidden="true"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon size={16} className={iconColor} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted/50">{type}</p>
                    <p className="text-[14px] text-muted">{title}</p>
                  </div>
                  <span className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${gradeBg}`}>{grade}</span>
                </div>
              ))}
              <p className="pt-2 text-[11px] text-muted/40 italic">Preview — these aren&apos;t real results</p>
            </div>

            <Link href="/learn/library" className="mt-6 inline-flex items-center gap-2 rounded-full bg-bottle px-6 py-2.5 text-[14px] font-semibold text-egg shadow-lift-sm">
              <BookOpen size={16} />
              Go to your library
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">{/* Results list */}</div>
      )}
    </div>
  );
}
