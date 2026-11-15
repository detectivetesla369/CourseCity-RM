'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface SelectionCardProps {
  icon: ReactNode;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

export function SelectionCard({ icon, label, description, selected, onSelect }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`
        group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left
        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-bottle
        ${selected
          ? 'border-bottle bg-bottle text-white shadow-[0_4px_16px_rgba(0,50,35,0.2)]'
          : 'border-bottle/8 bg-white text-bottle hover:border-bottle/20 hover:shadow-[0_2px_8px_rgba(0,50,35,0.08)]'
        }
        ${selected ? 'scale-[1.02]' : 'hover:scale-[1.01] active:scale-[0.98]'}
      `}
    >
      {/* Check badge */}
      <span
        className={`
          absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full
          transition-all duration-300
          ${selected
            ? 'bg-salad text-white scale-100 opacity-100'
            : 'bg-bottle/5 text-transparent scale-75 opacity-0'
          }
        `}
        aria-hidden="true"
      >
        <Check size={14} strokeWidth={3} />
      </span>

      {/* Icon */}
      <span
        className={`
          flex h-10 w-10 items-center justify-center rounded-xl
          transition-colors duration-300
          ${selected ? 'bg-white/15 text-white' : 'bg-orange/10 text-orange'}
        `}
      >
        {icon}
      </span>

      {/* Text */}
      <div>
        <span className="block text-sm font-bold leading-snug">{label}</span>
        {description && (
          <span
            className={`mt-1 block text-xs leading-relaxed transition-colors duration-300 ${
              selected ? 'text-white/65' : 'text-muted'
            }`}
          >
            {description}
          </span>
        )}
      </div>
    </button>
  );
}
