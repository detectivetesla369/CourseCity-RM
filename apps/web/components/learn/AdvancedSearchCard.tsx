'use client';

import { MoreHorizontal, Search } from 'lucide-react';

export default function AdvancedSearchCard() {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] text-neutral-600">
          Advanced <span className="font-bold text-neutral-800">Search</span>
        </h2>
        <button
          type="button"
          aria-label="More options"
          className="flex items-center justify-center rounded-[8px] text-neutral-400 transition-colors duration-100 hover:text-neutral-600"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Search row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Start writing something"
            className="h-[44px] w-full rounded-full border border-neutral-150 bg-neutral-50 pl-10 pr-4 text-[14px] text-neutral-800 placeholder:text-neutral-400 transition-all duration-100 focus:border-primary-500 focus:bg-white focus:shadow-focus focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="h-[44px] rounded-full bg-primary-500 px-6 text-[14px] font-medium text-white transition-colors duration-100 hover:bg-primary-600"
        >
          Find
        </button>
      </div>
    </div>
  );
}
