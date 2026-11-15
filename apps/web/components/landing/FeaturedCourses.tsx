'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { useMotion, gsap, ScrollTrigger, MEDIA } from '@/lib/motion';
import { useMediaQuery } from '@/lib/use-media-query';
import { ArrowRight, Star, BookOpen, Grid3X3 } from 'lucide-react';
import { CourseFace } from './CourseFace';
import { TOP_COURSES } from './top-courses';

/* ─── Course data ─── */

interface Course {
  title: string;
  instructor: string;
  price: string;
  free: boolean;
  rating: number;
  reviews: number;
  lessons: number;
  category: string;
  desc: string;
  accent: string;        // top stripe color
  iconBg: string;        // icon badge bg
  avatarGradient: string; // carousel card gradient
}

const COURSES: Course[] = [
  {
    title: 'Design Systems',
    instructor: 'Sarah Chen',
    desc: 'From first token to full rhythm.',
    price: '$49',
    free: false,
    rating: 4.8,
    reviews: 312,
    lessons: 24,
    category: 'Design',
    accent: 'bg-orange',
    iconBg: 'bg-orange text-white',
    avatarGradient: 'from-orange to-orange-deep',
  },
  {
    title: 'Creative Coding',
    instructor: 'Marcus Rivera',
    desc: 'Make interfaces feel alive.',
    price: '$35',
    free: false,
    rating: 4.9,
    reviews: 189,
    lessons: 18,
    category: 'Development',
    accent: 'bg-blue',
    iconBg: 'bg-blue text-white',
    avatarGradient: 'from-blue to-blue/80',
  },
  {
    title: 'Field Notes',
    instructor: 'Dr. Amara Obi',
    desc: 'Research that moves teams.',
    price: 'Free',
    free: true,
    rating: 4.7,
    reviews: 247,
    lessons: 12,
    category: 'Research',
    accent: 'bg-salad',
    iconBg: 'bg-salad text-white',
    avatarGradient: 'from-salad to-salad/70',
  },
  {
    title: 'Modern Typography',
    instructor: 'Elena Vasquez',
    desc: 'The art of beautiful type.',
    price: '$29',
    free: false,
    rating: 4.6,
    reviews: 156,
    lessons: 16,
    category: 'Design',
    accent: 'bg-orange',
    iconBg: 'bg-orange text-white',
    avatarGradient: 'from-[#3a2a18]/90 to-[#2a1a08]/80',
  },
  {
    title: 'Data Visualization',
    instructor: 'James Park',
    desc: 'Tell stories with data.',
    price: '$45',
    free: false,
    rating: 4.8,
    reviews: 203,
    lessons: 20,
    category: 'Data',
    accent: 'bg-blue',
    iconBg: 'bg-blue text-white',
    avatarGradient: 'from-[#1a2a3a]/90 to-[#0a1a2a]/80',
  },
  {
    title: 'Writing for the Web',
    instructor: 'Priya Sharma',
    desc: 'Words that connect.',
    price: '$25',
    free: false,
    rating: 4.5,
    reviews: 178,
    lessons: 14,
    category: 'Writing',
    accent: 'bg-salad',
    iconBg: 'bg-salad text-white',
    avatarGradient: 'from-[#2a3a2a]/90 to-[#1a2a1a]/80',
  },
];

/* ─── 3D showcase: client-only, code-split, desktop + fine pointer only ─── */

const CourseCardScene = dynamic(() => import('./CourseCardScene'), {
  ssr: false,
  loading: () => <div className="h-[440px] w-full" aria-hidden="true" />,
});

const SHOW_3D_QUERY = `${MEDIA.desktop} and (hover: hover) and (pointer: fine)`;

/* ─── Carousel card (dark glass) ─── */

function CarouselCard({ course }: { course: Course }) {
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-[24px] bg-gradient-to-b from-[#2c2620]/[0.97] to-[#1a1510]/[0.97] p-6 backdrop-blur-sm border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-white/50">
          {course.category}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-white/40">
          <Star size={10} className="fill-orange text-orange" />
          {course.rating} ({course.reviews})
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center py-5">
        <div
          className={`mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br ${course.avatarGradient} shadow-xl`}
        >
          <BookOpen size={32} className="text-white/80" />
        </div>
        <h3 className="text-[17px] font-bold text-white leading-snug">{course.title}</h3>
        <p className="mt-2 text-[13px] text-white/45">{course.instructor}</p>
        <p className="mt-3 text-[12px] text-white/35 leading-relaxed max-w-[220px]">
          {course.lessons} lessons · {course.free ? 'Free access' : 'Full course'}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="flex items-center gap-1.5 text-[12px] text-white/35">
          <BookOpen size={12} /> {course.lessons} lessons
        </span>
        {course.free ? (
          <span className="rounded-full bg-salad/20 px-3 py-1 text-[12px] font-bold text-salad">
            Free
          </span>
        ) : (
          <span className="text-[15px] font-bold text-white/80">{course.price}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Section ─── */

export function FeaturedCourses() {
  const sectionRef = useRef<HTMLElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const carouselWrapRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const show3D = useMediaQuery(SHOW_3D_QUERY);

  // TODO: route to /courses/[id] once the course detail page exists.
  const openCourse = () => {
    carouselWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useMotion(sectionRef, (env) => {
    if (env.reduce) return;
    const section = sectionRef.current;
    const city = cityRef.current;
    const carouselWrap = carouselWrapRef.current;
    const carousel = carouselRef.current;
    if (!section || !city || !carouselWrap || !carousel) return;

    const cards = carousel.querySelectorAll<HTMLElement>('[data-carousel-card]');
    const total = cards.length;
    if (!total) return;

    /* ──── City cards entrance (non-WebGL fallback) ──── */
    const cityCards = city.querySelectorAll<HTMLElement>('[data-city-card]');
    cityCards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          delay: 0.15 + i * 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: city, start: 'top 80%', once: true },
        },
      );
    });

    /* ──── Transition: city fades out, carousel fades in ──── */
    gsap.set(carouselWrap, { opacity: 0, y: 40 });

    ScrollTrigger.create({
      trigger: carouselWrap,
      start: 'top 85%',
      end: 'top 55%',
      scrub: 0.4,
      onUpdate: (self) => {
        gsap.set(carouselWrap, {
          opacity: self.progress,
          y: 40 * (1 - self.progress),
        });
      },
    });

    if (env.desktop) {
      /* ──── Desktop: pinned 3D carousel ──── */
      const CARD_W = 340;
      const GAP = 32;
      const OFFSET = CARD_W + GAP;
      const ROTATE_Y = 38;
      const Z_BACK = -200;
      const SCALE_SIDE = 0.85;
      const SCALE_FAR = 0.75;

      function layoutCards(activeIdx: number) {
        cards.forEach((card, i) => {
          const diff = i - activeIdx;
          const absDiff = Math.abs(diff);
          const sign = diff > 0 ? 1 : diff < 0 ? -1 : 0;
          const clampDiff = Math.min(absDiff, 3);

          const x = diff * OFFSET;
          const rotY = -sign * ROTATE_Y * Math.min(absDiff, 1);
          const z = clampDiff === 0 ? 0 : Z_BACK * Math.min(clampDiff, 2);

          let scale: number;
          if (absDiff < 0.01) scale = 1;
          else if (absDiff <= 1) scale = 1 - (1 - SCALE_SIDE) * absDiff;
          else scale = SCALE_SIDE - (SCALE_SIDE - SCALE_FAR) * Math.min(absDiff - 1, 1);

          let opacity: number;
          if (absDiff < 0.01) opacity = 1;
          else if (absDiff <= 1) opacity = 1 - 0.45 * absDiff;
          else opacity = 0.55 - 0.35 * Math.min(absDiff - 1, 1);

          const zIndex = 100 - Math.round(absDiff * 10);

          gsap.set(card, { x, rotateY: rotY, z, scale, opacity, zIndex });
        });
      }

      layoutCards(0);

      ScrollTrigger.create({
        trigger: carouselWrap,
        start: 'top 15%',
        end: () => `+=${(total - 1) * 50}%`,
        pin: true,
        pinSpacing: true,
        scrub: 0.4,
        onUpdate: (self) => layoutCards(self.progress * (total - 1)),
      });
    } else {
      /* ──── Mobile: scroll snap ──── */
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: carouselWrap, start: 'top 75%', once: true },
        },
      );
    }
  });

  return (
    <section
      ref={sectionRef}
      id="courses"
      className="relative overflow-hidden bg-egg"
    >
      {/* ───────── Part 1: City-style showcase ───────── */}
      <div ref={cityRef} className="py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left: 3D city cards */}
            <div className="relative order-2 min-w-0 lg:order-1 lg:col-span-7">
              {show3D ? (
                <Reveal variant="up">
                  <CourseCardScene onOpen={openCourse} />
                </Reveal>
              ) : (
                <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-6 scrollbar-none md:-mx-8 md:px-8 lg:mx-0 lg:justify-center lg:overflow-visible lg:px-0">
                  {TOP_COURSES.map((course) => (
                    <div key={course.id} data-city-card className="snap-center">
                      <CourseFace
                        course={course}
                        variant="card"
                        aria-label={`${course.title} — #${course.rank} most purchased. Open course`}
                        onClick={openCourse}
                        className="rounded-[13px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted">
                <span className="flex h-2 w-2 rounded-full bg-orange" />
                {show3D ? 'DRAG TO EXPLORE · TAP A COURSE TO OPEN' : 'SWIPE TO EXPLORE · TAP A COURSE TO OPEN'}
              </div>
            </div>

            {/* Right: heading */}
            <div className="order-1 lg:order-2 lg:col-span-5">
              <Reveal variant="up">
                <span className="eyebrow">EXPLORE THE CITY</span>
              </Reveal>
              <RevealText
                text={"Courses\nwith a little\n*more dimension.*"}
                mode="word"
                className="t-display mt-4"
              />
              <Reveal variant="up" delay={0.3}>
                <p className="mt-6 text-base text-muted leading-relaxed max-w-sm">
                  Our three most purchased courses, ranked. Explore the details
                  and find a course that fits your next move.
                </p>
              </Reveal>
              <Reveal variant="up" delay={0.45}>
                <div className="mt-6 flex items-center gap-2 text-sm">
                  <span className="flex h-3 w-3 rounded-full bg-salad animate-pulse" />
                  <span className="eyebrow text-muted text-[11px]">
                    INTERACTIVE COURSE EXPLORER
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Part 2: Scroll carousel ───────── */}
      <div ref={carouselWrapRef} className="pb-16 md:pb-20">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
          {/* Desktop carousel */}
          <div
            ref={carouselRef}
            className="hidden lg:flex relative mx-auto items-center justify-center"
            style={{
              perspective: '1000px',
              perspectiveOrigin: '50% 50%',
              height: '480px',
            }}
          >
            {COURSES.map((course) => (
              <div
                key={course.title}
                data-carousel-card
                className="absolute"
                style={{
                  width: '340px',
                  height: '440px',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                }}
              >
                <CarouselCard course={course} />
              </div>
            ))}
          </div>

          {/* Mobile scroll */}
          <div className="lg:hidden -mx-5 px-5 overflow-x-auto scrollbar-none">
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {COURSES.map((course) => (
                <div
                  key={course.title}
                  data-carousel-card
                  className="w-[300px] shrink-0"
                  style={{ scrollSnapAlign: 'center', height: '420px' }}
                >
                  <CarouselCard course={course} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTAs */}
          <Reveal variant="up" delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a href="#courses" className="btn btn-primary">
                <ArrowRight size={16} /> Find your course
              </a>
              <a href="#courses" className="btn btn-ghost text-bottle">
                <Grid3X3 size={16} /> See all courses
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
