'use client';

import { Plus } from 'lucide-react';

interface NowWatchingProps {
  count?: number;
}

const WATCHERS = [
  { name: 'Greg Montgomery', handle: '@sigley', initial: 'G', color: 'bg-info' },
  { name: 'Leila Jefferson', handle: '@leilatearts', initial: 'L', color: 'bg-success' },
  { name: 'Monica Fury', handle: '@monicaaan', initial: 'M', color: 'bg-primary-500' },
];

export default function NowWatching({ count = 88 }: NowWatchingProps) {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <h3 className="text-[16px] text-neutral-600">
          Now <span className="font-bold text-neutral-800">Watching</span>
        </h3>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
        </span>
        <span className="rounded-[6px] bg-primary-500 px-2 py-0.5 text-[11px] font-medium text-white">
          {count}
        </span>
      </div>

      {/* User list — 16px gap (proximity) */}
      <div className="flex flex-col gap-4">
        {WATCHERS.map((user) => (
          <div key={user.handle} className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${user.color} text-[13px] font-bold text-white`}>
              {user.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-neutral-800">{user.name}</p>
              <p className="truncate text-[11px] text-neutral-500">{user.handle}</p>
            </div>
            <button
              type="button"
              aria-label={`Follow ${user.name}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors duration-100 hover:text-primary-500"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Plus size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
