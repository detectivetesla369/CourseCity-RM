'use client';

import { Bookmark, Share2 } from 'lucide-react';

interface InstructorHeaderProps {
  name: string;
  role?: string;
}

const COLORS = ['bg-primary-500', 'bg-info', 'bg-success', 'bg-warning'] as const;

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function InstructorHeader({ name, role = 'Course Tutor' }: InstructorHeaderProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-full ring-2 ring-primary-200 ring-offset-2 ring-offset-white">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getColor(name)} text-[18px] font-bold text-white`}>
            {initial}
          </div>
        </div>
        <div>
          <p className="text-[15px] font-medium text-neutral-800">{name}</p>
          <p className="text-[13px] text-neutral-500">{role}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Bookmark"
          className="flex h-9 w-9 items-center justify-center rounded-[8px] text-neutral-400 transition-colors duration-100 hover:bg-neutral-50 hover:text-neutral-700"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Bookmark size={16} />
        </button>
        <button
          type="button"
          aria-label="Share"
          className="flex h-9 w-9 items-center justify-center rounded-[8px] text-neutral-400 transition-colors duration-100 hover:bg-neutral-50 hover:text-neutral-700"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
}
