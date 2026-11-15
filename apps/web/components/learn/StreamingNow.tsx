'use client';

const INSTRUCTORS = [
  { name: 'Nia Okafor', initial: 'N', color: 'bg-primary-500' },
  { name: 'Mila Chen', initial: 'M', color: 'bg-info' },
  { name: 'Jo Alabi', initial: 'J', color: 'bg-success' },
  { name: 'Amara Reed', initial: 'A', color: 'bg-warning' },
  { name: 'Sam Okonkwo', initial: 'S', color: 'bg-neutral-600' },
  { name: 'Tunde Adeyemi', initial: 'T', color: 'bg-neutral-800' },
];

export default function StreamingNow() {
  return (
    <div className="scrollbar-none flex gap-3 overflow-x-auto lg:flex-wrap">
      {INSTRUCTORS.map((inst) => (
        <button
          key={inst.name}
          title={inst.name}
          className="relative shrink-0 transition-transform duration-100 hover:scale-105"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${inst.color} text-[14px] font-bold text-white`}
          >
            {inst.initial}
          </div>
          <span className="online-dot" />
        </button>
      ))}
    </div>
  );
}
