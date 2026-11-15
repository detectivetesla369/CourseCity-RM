'use client';

import { Plus } from 'lucide-react';

const TUTORS = [
  { name: 'Melanie Grutt', handle: '@melangrutt', initial: 'M', color: 'bg-primary-500' },
  { name: 'Keira Danlop', handle: '@ordanlop.edu', initial: 'K', color: 'bg-info' },
  { name: 'Kenny Foster', handle: '@fosterklow', initial: 'K', color: 'bg-success' },
  { name: 'Aaron Kandroll', handle: '@aaronkandrolcas', initial: 'A', color: 'bg-warning' },
  { name: 'Alex Dixon', handle: '@alexbrains', initial: 'A', color: 'bg-neutral-600' },
];

export default function TopTutorsCard() {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-[16px] text-neutral-600">
        Top <span className="font-bold text-neutral-800">Tutors</span>
      </h2>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {TUTORS.map((tutor) => (
          <div key={tutor.handle} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tutor.color} text-[13px] font-bold text-white`}
            >
              {tutor.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-neutral-800">{tutor.name}</p>
              <p className="truncate text-[11px] text-neutral-500">{tutor.handle}</p>
            </div>
            <button
              type="button"
              aria-label={`Follow ${tutor.name}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors duration-100 hover:text-primary-500"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Plus size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
