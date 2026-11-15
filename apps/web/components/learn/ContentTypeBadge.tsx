'use client';

import { BookOpen, Video, Radio } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Course Content Types                                                */
/* ------------------------------------------------------------------ */
export type CourseContentType = 'ebook' | 'video' | 'live';

export const CONTENT_TYPE_META: Record<
  CourseContentType,
  { label: string; icon: typeof BookOpen; color: string; bgColor: string; dotColor: string }
> = {
  ebook: {
    label: 'E-Book',
    icon: BookOpen,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    dotColor: 'bg-primary-500',
  },
  video: {
    label: 'Video',
    icon: Video,
    color: 'text-info',
    bgColor: 'bg-info-light',
    dotColor: 'bg-info',
  },
  live: {
    label: 'Live',
    icon: Radio,
    color: 'text-success',
    bgColor: 'bg-success-light',
    dotColor: 'bg-success',
  },
};

/**
 * Deterministically assign a content type to a course based on its index.
 * In production this would come from the API.
 */
export function getCourseContentType(index: number): CourseContentType {
  const types: CourseContentType[] = ['video', 'ebook', 'live'];
  return types[index % 3];
}

/**
 * Derive content type from a course ID string (for detail pages).
 */
export function getCourseContentTypeById(id: string): CourseContentType {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  const types: CourseContentType[] = ['video', 'ebook', 'live'];
  return types[Math.abs(hash) % 3];
}

/* ------------------------------------------------------------------ */
/*  ContentTypeBadge — pill badge showing content type                  */
/* ------------------------------------------------------------------ */
export default function ContentTypeBadge({
  type,
  size = 'sm',
}: {
  type: CourseContentType;
  size?: 'sm' | 'md';
}) {
  const meta = CONTENT_TYPE_META[type];
  const Icon = meta.icon;

  if (size === 'md') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold ${meta.bgColor} ${meta.color}`}
      >
        <Icon size={14} strokeWidth={2} />
        {meta.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[10px] font-bold ${meta.bgColor} ${meta.color}`}
    >
      <Icon size={11} strokeWidth={2} />
      {meta.label}
    </span>
  );
}
