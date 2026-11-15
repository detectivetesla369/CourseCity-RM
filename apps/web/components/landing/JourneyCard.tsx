import type { JourneyStep } from './journey-steps';

/** Label card shared by the 3D scene and the flat (mobile) journey. */
export function JourneyCard({ step, showIcon = true }: { step: JourneyStep; showIcon?: boolean }) {
  const Icon = step.icon;
  return (
    <div className="rounded-panel bg-white p-4 shadow-lift-md ring-1 ring-bottle/5">
      <div className="flex items-center gap-2.5">
        {showIcon && (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full"
            style={{ background: step.color, color: step.ink }}
            aria-hidden
          >
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
        <span className="eyebrow">{step.tag}</span>
      </div>
      <h3 className={`${showIcon ? 'mt-3' : 'mt-2'} text-lg font-bold leading-tight text-bottle`}>{step.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{step.desc}</p>
    </div>
  );
}
