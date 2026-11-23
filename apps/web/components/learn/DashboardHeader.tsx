'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  Target,
  BookOpen,
  Library,
  Award,
  Flame,
  ChevronDown,
  Compass,
  Heart,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Category filter tags (from Quest/Image-1 search bar)               */
/* ------------------------------------------------------------------ */
const categories = [
  { label: 'UI/UX Design', active: true },
  { label: 'Illustration', active: false },
  { label: 'Development', active: false },
  { label: 'Typography', active: false },
  { label: 'Research', active: false },
];

/* ------------------------------------------------------------------ */
/*  "Learn" dropdown items (from Exercism/Image-2 nav)                 */
/* ------------------------------------------------------------------ */
const learnMenuItems = [
  {
    href: '/courses',
    icon: Compass,
    label: 'Course Catalog',
    desc: 'Browse all available courses',
    isNew: false,
  },
  {
    href: '/learn/library',
    icon: Library,
    label: 'My Library',
    desc: 'Your saved and bookmarked resources',
    isNew: true,
  },
  {
    href: '/learn/certificates',
    icon: Award,
    label: 'Certificates',
    desc: 'View your earned certificates',
    isNew: false,
  },
  {
    href: '/learn/results',
    icon: Target,
    label: 'Your Progress',
    desc: 'Track your learning journey',
    isNew: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Quick nav tabs (hybrid of both images)                             */
/* ------------------------------------------------------------------ */
const quickTabs = [
  { href: '/learn', label: 'Dashboard' },
  { href: '/courses', label: 'Courses' },
  { href: '/learn/library', label: 'Library' },
  { href: '/learn/certificates', label: 'Certificates' },
  { href: '/learn/orders', label: 'Orders' },
];

/* ------------------------------------------------------------------ */
/*  DashboardHeader                                                     */
/* ------------------------------------------------------------------ */
export default function DashboardHeader({
  displayName,
  initials,
  notificationCount = 3,
  streakDays = 5,
}: {
  displayName: string;
  initials: string;
  notificationCount?: number;
  streakDays?: number;
}) {
  const firstName = displayName.split(' ')[0];

  /* ── Search state ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Category filter state ── */
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(['UI/UX Design']),
  );

  const toggleCategory = (label: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  /* ── Learn dropdown state ── */
  const [learnOpen, setLearnOpen] = useState(false);
  const learnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) {
        setLearnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Active tab ── */
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/learn';

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  TOP BAR — Search + Categories + Actions (Quest-style)        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-[20px] bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* ── Search input ── */}
          <div
            className={`relative flex min-w-0 flex-1 items-center gap-2 rounded-[12px] border px-3.5 py-2.5 transition-all duration-150 ${
              searchFocused
                ? 'border-primary-500 bg-white shadow-focus'
                : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
            }`}
            style={{ minHeight: '44px' }}
          >
            <Search
              size={18}
              className={`shrink-0 transition-colors duration-100 ${
                searchFocused ? 'text-primary-500' : 'text-neutral-400'
              }`}
            />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search anything..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-neutral-800 outline-none placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchRef.current?.focus();
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* ── Category filter pills (scrollable on mobile) ── */}
          <div className="scrollbar-none flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => {
              const isActive = activeCategories.has(cat.label);
              return (
                <button
                  key={cat.label}
                  onClick={() => toggleCategory(cat.label)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-all duration-100 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                  }`}
                  style={{ minHeight: '36px' }}
                >
                  {isActive && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  )}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* ── Right actions: streak, bell, avatar ── */}
          <div className="flex items-center gap-2">
            {/* Streak indicator (Exercism-style reputation) */}
            {streakDays > 0 && (
              <div
                className="hidden items-center gap-1.5 rounded-[8px] bg-primary-50 px-3 py-2 sm:flex"
                style={{ minHeight: '36px' }}
              >
                <Flame size={16} className="text-primary-500" />
                <span className="text-[13px] font-bold text-primary-700">
                  {streakDays}
                </span>
              </div>
            )}

            {/* Notification bell */}
            <Link
              href="/learn/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-[12px] bg-neutral-50 text-neutral-500 transition-colors duration-100 hover:bg-neutral-100 hover:text-neutral-700"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.8} />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>

            {/* Profile avatar */}
            <Link
              href="/account/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-[13px] font-bold text-white transition-shadow duration-100 hover:shadow-md"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Your profile"
            >
              {initials}
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  GREETING + QUICK ACTIONS (Quest greeting + Exercism nav)     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-[20px] bg-white px-6 py-5 shadow-sm">
        {/* Top row: greeting + action buttons */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-[22px] font-bold text-neutral-800 lg:text-[26px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              Hello, {firstName} 👋
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              What do you want to learn today?
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Add Your Goal button (Quest-style) */}
            <button className="flex items-center gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-700 transition-all duration-100 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
              <Target size={16} />
              Add Your Goal
            </button>

            {/* Learn dropdown (Exercism-style) */}
            <div ref={learnRef} className="relative">
              <button
                onClick={() => setLearnOpen(!learnOpen)}
                className={`flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13px] font-medium transition-all duration-100 ${
                  learnOpen
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                style={{ minHeight: '40px' }}
              >
                <BookOpen size={16} />
                Learn
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-150 ${learnOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              {learnOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-[16px] bg-white p-2 shadow-lg ring-1 ring-neutral-200/60">
                  {learnMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setLearnOpen(false)}
                      className="flex items-start gap-3 rounded-[12px] px-3 py-3 transition-colors duration-100 hover:bg-neutral-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary-500">
                        <item.icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-neutral-800">
                            {item.label}
                          </span>
                          {item.isNew && (
                            <span className="rounded-[4px] bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="my-4 h-px bg-neutral-100" />

        {/* ── Quick navigation tabs ── */}
        <div className="scrollbar-none -mb-1 flex items-center gap-1 overflow-x-auto">
          {quickTabs.map((tab) => {
            const isActive =
              tab.href === '/learn'
                ? pathname === '/learn'
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative shrink-0 rounded-[8px] px-3.5 py-2 text-[13px] font-medium transition-colors duration-100 ${
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                }`}
                style={{ minHeight: '36px' }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
