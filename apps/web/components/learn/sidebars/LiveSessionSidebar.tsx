'use client';

import Link from 'next/link';
import {
  Radio,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle,
  Circle,
} from 'lucide-react';

const PARTICIPANTS_LIST = [
  { name: 'Berlian Jodie', role: 'Host', initial: 'BJ', color: 'bg-primary-500' },
  { name: 'Megan Fernandez', role: 'Student', initial: 'MF', color: 'bg-info' },
  { name: 'Monalisa Ackerman', role: 'Student', initial: 'MA', color: 'bg-success' },
  { name: 'Tommy Shelby', role: 'Student', initial: 'TS', color: 'bg-warning' },
  { name: 'Netta Magnolya', role: 'Student', initial: 'NM', color: 'bg-error' },
];

const UPCOMING = [
  { title: 'Advanced React Patterns', date: 'Mon, Nov 18', time: '2:00 PM' },
  { title: 'API Design Workshop', date: 'Wed, Nov 20', time: '10:00 AM' },
  { title: 'Code Review Session', date: 'Fri, Nov 22', time: '3:00 PM' },
];

export default function LiveSessionSidebar() {
  return (
    <>
      {/* ── SESSION INFO — dark card ── */}
      <div className="overflow-hidden rounded-[16px] bg-neutral-800 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-error/20 px-2.5 py-0.5 text-[10px] font-bold text-error">
            <Circle size={6} className="animate-pulse fill-error" />
            LIVE
          </span>
          <span className="text-[11px] text-neutral-500">Session active</span>
        </div>

        <div className="space-y-3 text-[12px]">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> Duration
            </span>
            <span className="font-semibold text-white">01:24:36</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Users size={12} /> Attendees
            </span>
            <span className="font-semibold text-white">28 / 50</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={12} /> Attendance
            </span>
            <span className="font-semibold text-success">Confirmed</span>
          </div>
        </div>

        {/* Attendance bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[10px] text-neutral-500">
            <span>Capacity</span>
            <span>56%</span>
          </div>
          <div className="h-[4px] w-full overflow-hidden rounded-full bg-neutral-600">
            <div className="h-full w-[56%] rounded-full bg-success" />
          </div>
        </div>
      </div>

      {/* ── PARTICIPANTS ── */}
      <div className="rounded-[16px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
            Participants
          </p>
          <span className="text-[11px] font-semibold text-neutral-500">28</span>
        </div>

        <div className="space-y-2">
          {PARTICIPANTS_LIST.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5"
            >
              <div className="relative">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${p.color} text-[10px] font-bold text-white`}>
                  {p.initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-neutral-800">{p.name}</p>
                <p className="text-[10px] text-neutral-500">{p.role}</p>
              </div>
              {p.role === 'Host' && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-bold text-primary-600">
                  HOST
                </span>
              )}
            </div>
          ))}
          <button className="flex w-full items-center justify-center gap-1 rounded-[8px] bg-neutral-50 py-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100">
            +23 more
          </button>
        </div>
      </div>

      {/* ── UPCOMING SESSIONS ── */}
      <div className="rounded-[16px] bg-primary-500 p-5">
        <div className="mb-4 flex items-center gap-1.5">
          <Calendar size={12} className="text-white/70" />
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">
            Upcoming Sessions
          </p>
        </div>
        <div className="space-y-3">
          {UPCOMING.map((session) => (
            <Link
              key={session.title}
              href="/courses"
              className="block rounded-[8px] bg-white/10 p-3 transition-colors hover:bg-white/15"
            >
              <p className="text-[12px] font-semibold text-white line-clamp-1">{session.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-white/60">
                <span>{session.date}</span>
                <span>· {session.time}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
