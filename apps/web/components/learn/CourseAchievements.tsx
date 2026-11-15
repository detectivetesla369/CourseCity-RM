'use client';

import { Flame, Star, Trophy } from 'lucide-react';

interface CourseAchievementsProps {
  points: number;
  completionPercent: number;
  levelUps: number;
}

export default function CourseAchievements({ points, completionPercent, levelUps }: CourseAchievementsProps) {
  const stats = [
    { icon: Trophy, iconBg: 'bg-success-light', iconColor: 'text-success', value: points.toLocaleString(), label: 'points' },
    { icon: Flame, iconBg: 'bg-primary-50', iconColor: 'text-primary-500', value: `${completionPercent}%`, label: 'complete' },
    { icon: Star, iconBg: 'bg-info-light', iconColor: 'text-info', value: `+${levelUps}`, label: 'level up' },
  ] as const;

  return (
    <div>
      <h3 className="mb-4 text-[16px] text-neutral-600">
        Course <span className="font-bold text-neutral-800">Achievements</span>
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center rounded-[12px] bg-neutral-50 p-4 text-center">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${stat.iconBg}`}>
              <stat.icon size={16} className={stat.iconColor} />
            </div>
            <span className="text-[18px] font-bold text-neutral-800">{stat.value}</span>
            <span className="text-[11px] text-neutral-500">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
