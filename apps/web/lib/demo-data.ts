/**
 * CourseCity Demo Data Provider
 *
 * When NEXT_PUBLIC_DEMO_MODE=true (or the API is unreachable),
 * this module supplies realistic sample data so the full UI
 * can be previewed without a running backend.
 */

import type {
  CourseDetailDTO,
  EnrollmentDTO,
  AuthUser,
  AuthResponseDTO,
  AuthSessionDTO,
  CourseLevel,
} from '@coursecity/contracts';

/* ------------------------------------------------------------------ */
/*  Demo user                                                          */
/* ------------------------------------------------------------------ */
export const DEMO_USER: AuthUser & { displayName: string; avatarUrl: null } = {
  id: 'demo-user-001',
  email: 'learner@coursecity.com',
  status: 'ACTIVE',
  roles: ['LEARNER'],
  displayName: 'Alex Morgan',
  avatarUrl: null,
};

export const DEMO_AUTH_RESPONSE: AuthResponseDTO = {
  user: DEMO_USER,
  accessToken: 'demo-access-token',
  expiresInSeconds: 3600,
};

/* ------------------------------------------------------------------ */
/*  Demo courses                                                       */
/* ------------------------------------------------------------------ */
const makeCourse = (
  id: string,
  slug: string,
  title: string,
  subtitle: string,
  desc: string,
  level: CourseLevel,
  mins: number,
  price: number,
  publisher: string,
  modules: { title: string; lessons: { title: string; mins: number; preview?: boolean }[] }[],
  enrolled?: boolean,
): CourseDetailDTO => {
  let lessonOrder = 0;
  return {
    id,
    slug,
    title,
    subtitle,
    description: desc,
    coverImageUrl: undefined,
    level,
    estimatedDurationMinutes: mins,
    publisher: { id: `pub-${slug}`, name: publisher, slug: publisher.toLowerCase().replace(/\s/g, '-'), type: 'INSTRUCTOR', verified: true },
    priceMinor: price,
    currency: 'NGN',
    isFree: price === 0,
    isEnrolled: enrolled,
    modules: modules.map((mod, mi) => ({
      id: `mod-${slug}-${mi}`,
      title: mod.title,
      sortOrder: mi + 1,
      lessons: mod.lessons.map((l) => {
        lessonOrder++;
        return {
          id: `les-${slug}-${lessonOrder}`,
          title: l.title,
          slug: `lesson-${lessonOrder}`,
          sortOrder: lessonOrder,
          estimatedReadTimeMinutes: l.mins,
          isPreviewable: !!l.preview,
          isCompleted: enrolled && lessonOrder <= 4 ? true : false,
        };
      }),
    })),
  };
};

export const DEMO_COURSES: CourseDetailDTO[] = [
  makeCourse(
    'course-001', 'design-systems-full-rhythm',
    'Design Systems, from first token to full rhythm',
    'A practical guide to building and scaling design systems',
    'Learn how to create a coherent, scalable design system from scratch. We cover tokens, components, documentation, and team adoption. By the end, you\'ll have a working system that bridges design and engineering.',
    'INTERMEDIATE', 540, 1500000, 'Nia Okafor',
    [
      { title: 'Foundations', lessons: [
        { title: 'What is a design system?', mins: 8, preview: true },
        { title: 'Auditing your existing UI', mins: 12 },
        { title: 'Defining design principles', mins: 10 },
      ]},
      { title: 'Design Tokens', lessons: [
        { title: 'Colour systems and scales', mins: 15 },
        { title: 'Typography tokens', mins: 12 },
        { title: 'Spacing is a language', mins: 10 },
        { title: 'Elevation and shadow tokens', mins: 8 },
      ]},
      { title: 'Component Library', lessons: [
        { title: 'Atomic design in practice', mins: 14 },
        { title: 'Building accessible buttons', mins: 18 },
        { title: 'Form controls and validation', mins: 20 },
        { title: 'Layout primitives', mins: 12 },
      ]},
      { title: 'Adoption & Governance', lessons: [
        { title: 'Documentation that works', mins: 10 },
        { title: 'Versioning strategy', mins: 8 },
        { title: 'Getting buy-in from your team', mins: 12, preview: true },
      ]},
    ],
    true,
  ),
  makeCourse(
    'course-002', 'creative-coding-curious-interfaces',
    'Creative coding for curious interfaces',
    'Where code meets visual expression',
    'Explore the intersection of programming and art. Build generative visuals, interactive animations, and playful interfaces using modern web technologies. No prior creative coding experience needed.',
    'BEGINNER', 420, 1200000, 'Mila Chen',
    [
      { title: 'Getting Started', lessons: [
        { title: 'Setting up your canvas', mins: 10, preview: true },
        { title: 'The render loop', mins: 8 },
        { title: 'Coordinates and transforms', mins: 12 },
      ]},
      { title: 'Generative Patterns', lessons: [
        { title: 'Noise and randomness', mins: 15 },
        { title: 'Particle systems', mins: 18 },
        { title: 'Recursive structures', mins: 14 },
      ]},
      { title: 'Interaction Design', lessons: [
        { title: 'Mouse and touch input', mins: 12 },
        { title: 'Audio-reactive visuals', mins: 16 },
        { title: 'Scroll-driven animation', mins: 10 },
      ]},
    ],
    true,
  ),
  makeCourse(
    'course-003', 'field-notes-research',
    'Field notes: research that moves a team',
    'Turn curiosity into actionable insights',
    'Master the art of user research. Learn to plan studies, conduct interviews, synthesize findings, and present insights that actually change how your team builds. Practical exercises with real scenarios.',
    'INTERMEDIATE', 360, 0, 'Jo Alabi',
    [
      { title: 'Research Foundations', lessons: [
        { title: 'Start with a question', mins: 10, preview: true },
        { title: 'Choosing your method', mins: 14 },
        { title: 'Recruiting participants', mins: 12 },
      ]},
      { title: 'In the Field', lessons: [
        { title: 'Interview techniques', mins: 18 },
        { title: 'Observation and note-taking', mins: 12 },
        { title: 'Surveys that work', mins: 10 },
      ]},
      { title: 'Making Sense', lessons: [
        { title: 'Affinity mapping', mins: 14 },
        { title: 'Finding patterns', mins: 12 },
        { title: 'Writing actionable insights', mins: 10 },
      ]},
    ],
    false,
  ),
  makeCourse(
    'course-004', 'storytelling-before-building',
    'Tell the story before you build the thing',
    'Product narrative and strategic communication',
    'Great products start with a great story. Learn how to craft product narratives, write compelling briefs, and communicate strategy in a way that aligns your team and excites stakeholders.',
    'ALL_LEVELS', 300, 900000, 'Amara Reed',
    [
      { title: 'The Story Framework', lessons: [
        { title: 'Why story comes first', mins: 8, preview: true },
        { title: 'The hero is your user', mins: 10 },
        { title: 'Tension and resolution', mins: 12 },
      ]},
      { title: 'Writing Product Briefs', lessons: [
        { title: 'The one-page brief', mins: 14 },
        { title: 'Problem statements that stick', mins: 10 },
        { title: 'Measuring narrative success', mins: 8 },
      ]},
    ],
    false,
  ),
  makeCourse(
    'course-005', 'introduction-to-data-thinking',
    'Introduction to data thinking',
    'Make better decisions with data',
    'Develop a data-informed mindset without becoming a data scientist. Learn to ask the right questions, interpret charts, spot misleading statistics, and use data to support your arguments.',
    'BEGINNER', 240, 0, 'Sam Okonkwo',
    [
      { title: 'Data Literacy', lessons: [
        { title: 'Numbers are not neutral', mins: 10, preview: true },
        { title: 'Reading charts correctly', mins: 12 },
        { title: 'Common statistical traps', mins: 14 },
      ]},
      { title: 'Applied Data Thinking', lessons: [
        { title: 'Defining metrics that matter', mins: 12 },
        { title: 'A/B testing fundamentals', mins: 16 },
        { title: 'Presenting data persuasively', mins: 10 },
      ]},
    ],
    false,
  ),
  makeCourse(
    'course-006', 'accessible-web-design',
    'Accessible web design: building for everyone',
    'WCAG, ARIA, and inclusive patterns',
    'Accessibility isn\'t an afterthought — it\'s a design skill. Learn WCAG 2.2 guidelines, ARIA patterns, keyboard navigation, screen reader testing, and how to build interfaces that work for all users.',
    'ADVANCED', 480, 1800000, 'Tunde Adeyemi',
    [
      { title: 'Understanding Accessibility', lessons: [
        { title: 'The case for inclusive design', mins: 8, preview: true },
        { title: 'WCAG 2.2 overview', mins: 14 },
        { title: 'Disability types and assistive tech', mins: 12 },
      ]},
      { title: 'Building Accessible Components', lessons: [
        { title: 'Semantic HTML deep dive', mins: 16 },
        { title: 'ARIA roles and properties', mins: 18 },
        { title: 'Focus management patterns', mins: 14 },
        { title: 'Form accessibility', mins: 16 },
      ]},
      { title: 'Testing & Auditing', lessons: [
        { title: 'Automated testing tools', mins: 12 },
        { title: 'Manual screen reader testing', mins: 14 },
        { title: 'Writing an accessibility report', mins: 10 },
      ]},
    ],
    false,
  ),
];

/* ------------------------------------------------------------------ */
/*  Demo enrollments                                                   */
/* ------------------------------------------------------------------ */
export const DEMO_ENROLLMENTS: EnrollmentDTO[] = [
  {
    id: 'enr-001',
    courseId: 'course-001',
    courseTitle: 'Design Systems, from first token to full rhythm',
    courseSlug: 'design-systems-full-rhythm',
    status: 'ACTIVE',
    progressPercentage: 62,
    enrolledAt: '2026-09-15T10:00:00Z',
  },
  {
    id: 'enr-002',
    courseId: 'course-002',
    courseTitle: 'Creative coding for curious interfaces',
    courseSlug: 'creative-coding-curious-interfaces',
    status: 'ACTIVE',
    progressPercentage: 24,
    enrolledAt: '2026-10-02T14:30:00Z',
  },
];

/* ------------------------------------------------------------------ */
/*  Demo sessions                                                      */
/* ------------------------------------------------------------------ */
export const DEMO_SESSIONS: AuthSessionDTO[] = [
  {
    id: 'sess-001',
    ipAddress: '102.89.23.45',
    userAgent: 'Chrome/120 (Windows 11)',
    lastActivityAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    isCurrent: true,
  },
  {
    id: 'sess-002',
    ipAddress: '102.89.23.112',
    userAgent: 'Safari/17 (iPhone)',
    lastActivityAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    isCurrent: false,
  },
];

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
