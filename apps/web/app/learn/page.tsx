'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { EnrollmentDTO } from '@coursecity/contracts';

/* ─── New design system components ─── */
import DashboardHeader from '@/components/learn/DashboardHeader';
import StreamingNow from '@/components/learn/StreamingNow';
import AdvancedSearchCard from '@/components/learn/AdvancedSearchCard';
import WeekCalendar from '@/components/learn/WeekCalendar';
import PopularCourseCard from '@/components/learn/PopularCourseCard';
import SmallCourseCard from '@/components/learn/SmallCourseCard';
import TopTutorsCard from '@/components/learn/TopTutorsCard';
import SpecialOffersCard from '@/components/learn/SpecialOffersCard';

/* ------------------------------------------------------------------ */
/*  Skeleton — matches actual content layout (Doherty Threshold)       */
/* ------------------------------------------------------------------ */
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="h-24 rounded-[16px] bg-white" />
        <div className="h-24 rounded-[16px] bg-white" />
      </div>
      <div className="h-5 w-40 rounded-[6px] bg-white" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_280px]">
        <div className="h-[280px] rounded-[16px] bg-white" />
        <div className="h-[280px] rounded-[16px] bg-white" />
        <div className="space-y-4">
          <div className="h-[132px] rounded-[16px] bg-white" />
          <div className="h-[132px] rounded-[16px] bg-white" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-56 rounded-[16px] bg-white" />
        <div className="h-56 rounded-[16px] bg-white" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty Dashboard                                                    */
/* ------------------------------------------------------------------ */
function EmptyDashboard({ displayName }: { displayName: string }) {
  return (
    <div className="space-y-8">
      {/* Welcome card */}
      <div className="rounded-[16px] bg-white p-8">
        <p className="eyebrow mb-3">Your learning map</p>
        <h1 className="text-[24px] font-bold leading-tight text-neutral-800" style={{ letterSpacing: '-0.02em' }}>
          Welcome,{' '}
          <span className="text-primary-500">{displayName.split(' ')[0]}.</span>
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-neutral-600">
          Your learning journey begins here. Find a course and start building momentum.
        </p>
        <Link
          href="/courses"
          className="btn btn-primary mt-6 gap-2"
        >
          <Search size={16} />
          Explore courses
        </Link>
      </div>

      {/* Get started card */}
      <div className="relative overflow-hidden rounded-[16px] p-8" style={{ background: 'linear-gradient(135deg, #2d2a27 0%, #4a4641 100%)' }}>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-[6px] bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Sparkles size={14} />
            Get started
          </div>
          <h2 className="mt-5 text-[20px] font-bold text-white" style={{ letterSpacing: '-0.01em' }}>
            Discover courses built by<br />
            <span className="text-primary-400">expert creators.</span>
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/50">
            Browse structured courses across design, code, research, and more.
          </p>
          <Link href="/courses" className="btn btn-primary mt-6 gap-2">
            <Search size={16} />
            Browse courses
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Active Dashboard — 60/30/10 applied                                */
/* ------------------------------------------------------------------ */
function ActiveDashboard({
  enrollments,
  displayName,
}: {
  enrollments: EnrollmentDTO[];
  displayName: string;
}) {
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const inProgress = enrollments.filter(
    (e) => e.status === 'ACTIVE' && e.progressPercentage < 100,
  );

  const courseCardData = [
    {
      title: 'Learning How To Create Beautiful Scenes in Illustrator in 60 minutes',
      instructor: 'Lana Marandina',
      handle: '@lanamora',
      durationMins: 82,
      gradient: 'linear-gradient(145deg, #2d1b69 0%, #4a2d8c 40%, #6a4fb0 100%)',
      initial: 'L',
      href: inProgress[0] ? `/learn/courses/${inProgress[0].courseId}` : '/courses',
    },
    {
      title: 'Creating a Beautiful Portrait Illustration, Learning new Techniques and Tricks',
      instructor: 'Uran Design',
      handle: '@uranossd',
      durationMins: 65,
      gradient: 'linear-gradient(145deg, #9a3412 0%, #c2410c 40%, #ea580c 100%)',
      initial: 'U',
      href: inProgress[1] ? `/learn/courses/${inProgress[1].courseId}` : '/courses',
    },
  ];

  const smallCardData = [
    {
      title: 'Making a Beautiful Scene with New Presets, Created by Senior Illustrator',
      publisher: 'Birds Agency',
      durationMins: 84,
      gradient: 'linear-gradient(145deg, #1e3a5f 0%, #2d5a8a 50%, #4a7fb5 100%)',
      href: '/courses',
    },
    {
      title: 'Special Garden Grass Tutorial for Procreate',
      publisher: 'Uran Design',
      durationMins: 52,
      gradient: 'linear-gradient(145deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)',
      href: '/courses',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Dashboard Header (search + greeting + nav) ─── */}
      <DashboardHeader
        displayName={displayName}
        initials={initials}
      />

      {/* ─── Row 1: Streaming Now + Advanced Search (24px gap) ─── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[16px] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[16px] text-neutral-600">
            Streaming <span className="font-bold text-neutral-800">Now</span>
          </h2>
          <StreamingNow />
        </div>
        <AdvancedSearchCard />
      </div>

      {/* ─── Row 1.5: Week Calendar ─── */}
      <WeekCalendar />

      {/* ─── Row 2: Popular This Week ─── */}
      <div>
        <h2 className="mb-5 text-[16px] text-neutral-600">
          Popular <span className="font-bold text-neutral-800">This Week</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_280px]">
          {courseCardData.map((card) => (
            <Link key={card.instructor} href={card.href} className="block">
              <PopularCourseCard
                title={card.title}
                instructor={card.instructor}
                handle={card.handle}
                durationMins={card.durationMins}
                gradient={card.gradient}
                initial={card.initial}
              />
            </Link>
          ))}
          <div className="space-y-4">
            {smallCardData.map((card) => (
              <Link key={card.publisher + card.durationMins} href={card.href} className="block">
                <SmallCourseCard
                  title={card.title}
                  publisher={card.publisher}
                  durationMins={card.durationMins}
                  gradient={card.gradient}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Row 3: Top Tutors + Special Offers ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopTutorsCard />
        <SpecialOffersCard />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */
function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] bg-white py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-error-light text-error">
        <BookOpen size={22} />
      </div>
      <h2 className="text-[16px] font-bold text-neutral-800">Something went wrong</h2>
      <p className="mt-1 text-[13px] text-neutral-500">We couldn&apos;t load your dashboard.</p>
      <button onClick={onRetry} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function LearnDashboardPage() {
  const { user, api } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const displayName =
    ((user as unknown as Record<string, unknown>)?.displayName as string) ||
    user?.email?.split('@')[0] ||
    'Learner';

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getEnrollments();
      setEnrollments(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError onRetry={fetchData} />;
  if (enrollments.length === 0) return <EmptyDashboard displayName={displayName} />;

  return <ActiveDashboard enrollments={enrollments} displayName={displayName} />;
}
