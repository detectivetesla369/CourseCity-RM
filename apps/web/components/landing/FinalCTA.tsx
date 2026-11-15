'use client';

import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section
      className="on-orange relative overflow-hidden bg-gradient-to-b from-orange-deep via-orange to-[#ff7a1f]"
      style={{
        borderTopLeftRadius: '50% clamp(56px, 9vw, 132px)',
        borderTopRightRadius: '50% clamp(56px, 9vw, 132px)',
      }}
    >
      <div className="relative mx-auto max-w-[900px] px-5 py-28 text-center md:px-8 md:py-36">
        <Reveal variant="up">
          <span className="eyebrow text-bottle/70">READY TO START LEARNING?</span>
        </Reveal>

        <RevealText
          text={"Your next course\n*is waiting for you.*"}
          mode="char"
          className="t-h2 mt-5 text-white"
        />

        <Reveal variant="up" delay={0.5}>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a href="/auth/signup" className="btn btn-primary text-lg px-8">
              Enter CourseCity <ArrowRight size={18} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
