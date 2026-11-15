'use client';

import { RevealText } from '@/components/motion/RevealText';
import { Reveal } from '@/components/motion/Reveal';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

function CertificateVisual() {
  return (
    <Reveal variant="scale" delay={0.3}>
      <div className="card !rounded-[36px] !p-8 mx-auto max-w-sm text-center space-y-4 shadow-lift-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange text-xs font-bold text-bottle">
            CC
          </div>
          <span className="text-sm font-bold text-bottle">CourseCity</span>
        </div>

        <div className="h-px bg-egg-deep/30" />

        {/* Title */}
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-widest text-muted uppercase">
            Certificate of Completion
          </p>
          <h3 className="t-h3 text-bottle">Design Systems Fundamentals</h3>
        </div>

        {/* Recipient */}
        <div className="space-y-1">
          <p className="text-xs text-muted">Awarded to</p>
          <p className="text-lg font-bold text-bottle">Sarah Chen</p>
          <p className="text-xs text-muted">October 2026</p>
        </div>

        {/* Verification badge */}
        <div className="flex items-center justify-center gap-2 rounded-full bg-salad-wash/60 py-2 px-4 mx-auto w-fit">
          <ShieldCheck size={16} className="text-salad" />
          <span className="text-xs font-bold text-bottle">
            Verified · Ed25519 Signed
          </span>
        </div>

        {/* Code */}
        <div className="rounded-xl bg-egg p-3">
          <p className="font-mono text-xs text-muted tracking-wider">
            CC-CERT-20261015-A8K9F2
          </p>
          <div className="mx-auto mt-2 flex justify-center gap-0.5">
            {[3,2,4,2,3,2,3,4,3,2,4,3,2,3,4,3,2,4,3,2].map((w, i) => (
              <div
                key={i}
                className="h-6 rounded-sm bg-bottle/70"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Certificate() {
  const checks = [
    'Digitally signed and tamper-proof',
    'One-click public verification',
    'Shareable on LinkedIn and resumes',
    'Instant employer verification',
  ];

  return (
    <section className="on-dark bg-bottle py-28 md:py-36">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 px-5 md:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12">
        {/* Text */}
        <div>
          <Reveal variant="left">
            <span className="eyebrow on-dark">VERIFIED ACHIEVEMENTS</span>
          </Reveal>
          <RevealText
            text={"Proof that means\n*something.*"}
            mode="word"
            className="t-h2 mt-4 text-egg"
          />
          <Reveal variant="left" delay={0.2}>
            <p className="mt-4 max-w-md text-egg/70 leading-relaxed">
              Every CourseCity certificate is digitally signed and tamper-proof.
              Employers and institutions can verify your credentials instantly
              through our public verification portal.
            </p>
          </Reveal>
          <Reveal variant="left" delay={0.3}>
            <ul className="mt-6 space-y-3">
              {checks.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-egg/90"
                >
                  <CheckCircle2 size={18} className="shrink-0 text-salad" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal variant="left" delay={0.45}>
            <a href="#" className="btn btn-ghost text-egg mt-8">
              Learn about verification <ArrowRight size={16} />
            </a>
          </Reveal>
        </div>

        {/* Certificate visual */}
        <CertificateVisual />
      </div>
    </section>
  );
}
