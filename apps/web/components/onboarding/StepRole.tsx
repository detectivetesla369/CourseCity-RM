'use client';

import { SelectionCard } from './SelectionCard';
import { Palette, Code, Megaphone, FlaskConical, BarChart3, Briefcase, GraduationCap, MoreHorizontal } from 'lucide-react';

const ROLES = [
  { id: 'design', icon: <Palette size={20} />, label: 'Design' },
  { id: 'development', icon: <Code size={20} />, label: 'Development' },
  { id: 'marketing', icon: <Megaphone size={20} />, label: 'Marketing' },
  { id: 'research', icon: <FlaskConical size={20} />, label: 'Research' },
  { id: 'data', icon: <BarChart3 size={20} />, label: 'Data' },
  { id: 'management', icon: <Briefcase size={20} />, label: 'Management' },
  { id: 'student', icon: <GraduationCap size={20} />, label: 'Student' },
  { id: 'other', icon: <MoreHorizontal size={20} />, label: 'Other' },
] as const;

interface StepRoleProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function StepRole({ selected, onSelect }: StepRoleProps) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ letterSpacing: '-0.03em' }}>
        What kind of work<br />do you do?
      </h1>
      <p className="mt-2 text-sm text-muted">This helps us recommend the right courses for you.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ROLES.map((role) => (
          <SelectionCard
            key={role.id}
            icon={role.icon}
            label={role.label}
            selected={selected === role.id}
            onSelect={() => onSelect(role.id)}
          />
        ))}
      </div>
    </div>
  );
}
