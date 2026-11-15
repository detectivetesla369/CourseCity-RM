import { JOURNEY } from './journey-steps';
import { JourneyCard } from './JourneyCard';

/**
 * Vertical journey for touch / small screens and reduced motion.
 * Same steps as the 3D scene; the parent section animates the
 * `data-journey-*` hooks (chain draws, nodes pop) on mobile only.
 */
export function JourneyFlat() {
  return (
    <div className="relative mx-auto max-w-md">
      {/* Road + broken chain line behind the nodes (node centre = 24px) */}
      <div aria-hidden className="absolute bottom-6 left-[22px] top-6 w-[4px] rounded-full bg-egg-deep" />
      <div aria-hidden data-journey-chain className="journey-chain absolute bottom-6 left-[22px] top-6 w-[4px] origin-top" />

      <ol aria-label="Your learning journey" className="relative">
        {JOURNEY.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.id} data-journey-item className="relative flex items-start gap-4 pb-6 last:pb-0">
              <span
                data-journey-node
                aria-hidden
                className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-white shadow-lift-md"
              >
                <span
                  className="grid size-9 place-items-center rounded-full"
                  style={{ background: step.color, color: step.ink }}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
              </span>
              <div data-journey-card className="min-w-0 flex-1">
                <JourneyCard step={step} showIcon={false} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
