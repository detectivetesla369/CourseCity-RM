'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  Share2,
  PhoneOff,
  Users,
  MessageSquare,
  Send,
  Smile,
  Clock,
  Radio,
  CheckCircle,
  Volume2,
  Circle,
  MoreHorizontal,
  Hand,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { CourseDetailDTO } from '@coursecity/contracts';
import ContentTypeBadge from '@/components/learn/ContentTypeBadge';

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */
const PARTICIPANTS = [
  { name: 'Berlian Jodie', role: 'Host', initial: 'BJ', color: 'bg-primary-500', isHost: true },
  { name: 'Megan Fernandez', initial: 'MF', color: 'bg-info', isHost: false },
  { name: 'Monalisa Ackerman', initial: 'MA', color: 'bg-success', isHost: false },
  { name: 'You', initial: 'Y', color: 'bg-warning', isHost: false },
];

const CHAT_MESSAGES = [
  { id: 1, sender: 'Netta Magnolya', initial: 'NM', color: 'bg-success', time: '3m', text: 'Everything is possible 🙌' },
  { id: 2, sender: 'Tommy Shelby', initial: 'TS', color: 'bg-info', time: '2m', text: "Obviously it's me wkwk" },
  { id: 3, sender: 'You', initial: 'Y', color: 'bg-primary-500', time: '1m', text: 'Coding is not for everyone', isOwn: true },
  { id: 4, sender: 'Zinadine Jidan', initial: 'ZJ', color: 'bg-warning', time: '45s', text: 'You sometimes' },
];

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉', '🔥', '👏', '💯'];

/* ------------------------------------------------------------------ */
/*  Live Chat Panel                                                    */
/* ------------------------------------------------------------------ */
function LiveChatPanel() {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full flex-col rounded-[16px] bg-white shadow-sm">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary-500" />
          <h3 className="text-[14px] font-bold text-neutral-800">Live Chat</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <span className="text-[11px] font-medium text-neutral-500">24 online</span>
        </div>
      </div>

      {/* Attendance bar */}
      <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-2.5">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-neutral-400" />
          <span className="text-[12px] font-semibold text-neutral-700">12 : 34</span>
          <span className="text-[10px] text-neutral-400">before class</span>
        </div>
        <button className="ml-auto flex items-center gap-1.5 rounded-[8px] bg-primary-50 px-3 py-1.5 text-[11px] font-semibold text-primary-600 transition-colors hover:bg-primary-100">
          <CheckCircle size={12} />
          Confirm Attendance
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">
          {CHAT_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${msg.color}`}
              >
                {msg.initial}
              </div>
              <div className={`max-w-[75%] ${msg.isOwn ? 'text-right' : ''}`}>
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className={`text-[12px] font-semibold ${msg.isOwn ? 'text-primary-600' : 'text-neutral-700'}`}>
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-neutral-400">{msg.time}</span>
                </div>
                <div
                  className={`inline-block rounded-[12px] px-3.5 py-2 text-[13px] ${
                    msg.isOwn
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {/* Unread divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-[10px] font-medium text-neutral-400">Unread Messages (10)</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
        </div>
        <div ref={chatEndRef} />
      </div>

      {/* Emoji reactions */}
      {showEmoji && (
        <div className="border-t border-neutral-100 px-5 py-2.5">
          <div className="flex items-center gap-2">
            {EMOJI_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] transition-transform hover:scale-125 hover:bg-neutral-50"
                onClick={() => setShowEmoji(false)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          >
            <Smile size={18} />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message here..."
            className="h-[40px] flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 text-[13px] text-neutral-800 placeholder:text-neutral-400 transition-all focus:border-primary-500 focus:bg-white focus:outline-none"
          />
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Participant Thumbnail                                              */
/* ------------------------------------------------------------------ */
function ParticipantThumbnail({
  name,
  initial,
  color,
  isHost,
}: {
  name: string;
  initial: string;
  color: string;
  isHost: boolean;
}) {
  return (
    <div className="group relative flex flex-col items-center">
      <div
        className={`relative flex h-20 w-28 items-center justify-center overflow-hidden rounded-[12px] border-2 ${
          isHost ? 'border-primary-500' : 'border-neutral-200'
        } bg-neutral-800`}
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color} text-[14px] font-bold text-white`}>
          {initial}
        </div>
        {/* Mic indicator */}
        <div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-info text-white">
          <Mic size={10} />
        </div>
        {isHost && (
          <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-primary-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
            <Radio size={8} /> Host
          </div>
        )}
      </div>
      <p className="mt-1.5 max-w-[110px] truncate text-[11px] font-medium text-neutral-700">{name}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live Session Page                                                  */
/* ------------------------------------------------------------------ */
export default function LiveSessionPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { api } = useAuth();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    api
      .getCourseBySlug(courseId)
      .then((data: CourseDetailDTO) => {
        setCourse(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId, api]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-5 w-32 rounded bg-neutral-100" />
        <div className="h-[400px] rounded-[16px] bg-neutral-100" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-[20px] font-bold text-neutral-800">Session not found</h1>
        <Link href="/courses" className="mt-4 inline-flex items-center gap-1.5 text-[14px] text-primary-500 hover:underline">
          <ArrowLeft size={14} /> Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Top Bar ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/learn/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-[14px] text-neutral-500 transition-colors hover:text-neutral-800"
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <span className="rounded-[8px] bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-600">
            {course.modules[0]?.title || 'Programming'}
          </span>
          <span className="rounded-[8px] bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-600">
            Week 3
          </span>
          <ContentTypeBadge type="live" size="md" />
        </div>
      </div>

      {/* ─── Session Title ─── */}
      <div>
        <h1
          className="text-[24px] font-bold text-neutral-800 lg:text-[28px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {course.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
              BJ
            </div>
            <span className="text-[13px] text-neutral-600">
              Hosted by <span className="font-semibold text-neutral-800">Berlian Jodie</span>
            </span>
          </div>
          <div className="flex -space-x-2">
            {PARTICIPANTS.slice(0, 3).map((p) => (
              <div
                key={p.name}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white ${p.color} text-[9px] font-bold text-white`}
              >
                {p.initial}
              </div>
            ))}
            <div className="flex h-7 items-center rounded-full bg-neutral-100 pl-3 pr-2.5 text-[11px] font-medium text-neutral-600">
              +24
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content: Video + Chat ─── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Video area */}
        <div className="space-y-4">
          {/* Main video */}
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[16px] bg-neutral-800">
            {/* Simulated video feed */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 text-[28px] font-bold text-white">
              BJ
            </div>
            {/* Caption overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="rounded-[8px] bg-black/60 px-4 py-2 text-[13px] text-white backdrop-blur-sm">
                &ldquo;Who here can&apos;t code and then move on to design? raise your hand&rdquo;
              </div>
            </div>
            {/* Host name */}
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[12px] font-semibold text-white">Berlian Jodie</span>
              <Mic size={12} className="text-info" />
            </div>
            {/* Live indicator */}
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-error/90 px-3 py-1 text-[11px] font-bold text-white">
              <Circle size={8} className="animate-pulse fill-white" />
              LIVE
            </div>
          </div>

          {/* Participant thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {PARTICIPANTS.map((p) => (
              <ParticipantThumbnail key={p.name} {...p} />
            ))}
            {/* More participants */}
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-28 items-center justify-center rounded-[12px] border-2 border-dashed border-neutral-200 bg-neutral-50">
                <span className="text-[14px] font-bold text-neutral-400">+24</span>
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-500">Others</p>
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex items-center justify-center gap-2 rounded-[16px] bg-white p-4 shadow-sm">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200">
              <Volume2 size={18} />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-error text-white transition-colors hover:bg-error/90">
              <Circle size={10} className="fill-white" />
            </button>
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                isMicOn ? 'bg-info text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              onClick={() => setIsCamOn(!isCamOn)}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                isCamOn ? 'bg-info text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {isCamOn ? <Camera size={18} /> : <CameraOff size={18} />}
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200">
              <Smile size={18} />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200">
              <Monitor size={18} />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200">
              <Share2 size={18} />
            </button>
            <div className="mx-2 h-6 w-px bg-neutral-200" />
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200">
              <Hand size={18} />
            </button>
            <button className="flex h-11 items-center gap-2 rounded-full bg-error px-5 text-[13px] font-semibold text-white transition-colors hover:bg-error/90">
              <PhoneOff size={16} />
              Leave
            </button>
          </div>
        </div>

        {/* Live Chat Panel */}
        <LiveChatPanel />
      </div>
    </div>
  );
}
