'use client';

import { Check } from 'lucide-react';

const TOPICS = [
  { id: 'design-systems', label: 'Design Systems', emoji: '🎨' },
  { id: 'creative-coding', label: 'Creative Coding', emoji: '⚡' },
  { id: 'typography', label: 'Typography', emoji: '✦' },
  { id: 'data-viz', label: 'Data Visualization', emoji: '📊' },
  { id: 'writing', label: 'Writing', emoji: '✍️' },
  { id: 'research', label: 'Research', emoji: '🔬' },
  { id: 'ux', label: 'UX Design', emoji: '🧩' },
  { id: 'product', label: 'Product', emoji: '🚀' },
  { id: 'frontend', label: 'Frontend', emoji: '🖥️' },
  { id: 'leadership', label: 'Leadership', emoji: '👥' },
  { id: 'analytics', label: 'Analytics', emoji: '📈' },
  { id: 'strategy', label: 'Strategy', emoji: '🎯' },
] as const;

interface StepTopicsProps {
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function StepTopics({ selected, onToggle }: StepTopicsProps) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ letterSpacing: '-0.03em' }}>
        What topics<br />interest you?
      </h1>
      <p className="mt-2 text-sm text-muted">
        Pick as many as you like — we&apos;ll tailor your feed.
        <span className="ml-1 text-xs text-bottle/40">({selected.size} selected)</span>
      </p>

      <div className="mt-8 flex flex-wrap gap-2.5">
        {TOPICS.map((topic) => {
          const isSelected = selected.has(topic.id);
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onToggle(topic.id)}
              aria-pressed={isSelected}
              className={`
                group flex items-center gap-2 rounded-full border-2 px-4 py-2.5
                text-sm font-semibold transition-all duration-250
                focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-bottle
                ${isSelected
                  ? 'border-bottle bg-bottle text-white shadow-[0_2px_8px_rgba(0,50,35,0.15)]'
                  : 'border-bottle/8 bg-white text-bottle hover:border-bottle/20 hover:bg-egg active:scale-95'
                }
              `}
            >
              <span className="text-base">{topic.emoji}</span>
              {topic.label}
              <span
                className={`transition-all duration-250 ${
                  isSelected ? 'w-4 opacity-100' : 'w-0 opacity-0'
                } overflow-hidden`}
              >
                <Check size={14} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
