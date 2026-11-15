'use client';

import { SelectionCard } from './SelectionCard';
import { Rocket, Compass, Award, Users } from 'lucide-react';

const GOALS = [
  {
    id: 'career',
    icon: <Rocket size={20} />,
    label: 'Learn new skills for my career',
    description: 'Level up with structured, job-ready courses.',
  },
  {
    id: 'interest',
    icon: <Compass size={20} />,
    label: 'Explore a personal interest',
    description: 'Follow your curiosity at your own pace.',
  },
  {
    id: 'credentials',
    icon: <Award size={20} />,
    label: 'Earn certificates & credentials',
    description: 'Build a verifiable portfolio of achievements.',
  },
  {
    id: 'team',
    icon: <Users size={20} />,
    label: 'Level up my team',
    description: 'Equip your team with skills that stick.',
  },
] as const;

interface StepGoalsProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function StepGoals({ selected, onSelect }: StepGoalsProps) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ letterSpacing: '-0.03em' }}>
        What brings you to<br />CourseCity?
      </h1>
      <p className="mt-2 text-sm text-muted">Pick the one that fits best — you can always change this later.</p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => (
          <SelectionCard
            key={goal.id}
            icon={goal.icon}
            label={goal.label}
            description={goal.description}
            selected={selected === goal.id}
            onSelect={() => onSelect(goal.id)}
          />
        ))}
      </div>
    </div>
  );
}
