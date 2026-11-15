/**
 * Top three most-purchased courses shown in the "Explore the City" showcase.
 * Kept free of three.js imports so the mobile fallback can use it without
 * pulling the WebGL bundle.
 */
export interface TopCourse {
  id: string;
  rank: 1 | 2 | 3;
  title: string;
  category: string;
  copy: string;
  accent: string;
  tint: string;
  stat: string;
  icon: string;
  image?: string;
}

/** Sorted by rank (most purchased first). */
export const TOP_COURSES: readonly TopCourse[] = [
  {
    id: 'design-systems',
    rank: 1,
    title: 'Design Systems',
    category: 'DESIGN · 6H 40M',
    copy: 'From first token to full rhythm.',
    accent: '#FF6400',
    tint: '#FFE6D6',
    stat: '2.4k learners',
    icon: '✦',
  },
  {
    id: 'creative-coding',
    rank: 2,
    title: 'Creative Coding',
    category: 'CODE · 4H 10M',
    copy: 'Make interfaces feel alive.',
    accent: '#1F6FD6',
    tint: '#DBE9FB',
    stat: '1.8k learners',
    icon: '⌁',
  },
  {
    id: 'field-notes',
    rank: 3,
    title: 'Field Notes',
    category: 'RESEARCH · 3H 05M',
    copy: 'Research that moves a team.',
    accent: '#8CC850',
    tint: '#E3F1D2',
    stat: '986 learners',
    icon: '◌',
    image: '/images/field-notes.jpg',
  },
];

/** Podium arrangement, left → right: #2, #1 (centre, raised), #3. */
export const PODIUM: readonly TopCourse[] = [TOP_COURSES[1]!, TOP_COURSES[0]!, TOP_COURSES[2]!];
