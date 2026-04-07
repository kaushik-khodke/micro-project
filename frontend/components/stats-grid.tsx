'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  change?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const colorClasses = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

export function StatItem({
  label,
  value,
  unit,
  icon: Icon,
  change,
  color = 'blue',
}: StatItemProps) {
  const colors = colorClasses[color];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {unit && <p className="text-sm text-muted-foreground">{unit}</p>}
          </div>
          {change && <p className="text-xs text-green-600 font-medium mt-2">{change}</p>}
        </div>
        {Icon && (
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${colors.bg}`}>
            <Icon size={24} className={colors.text} />
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  items: StatItemProps[];
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function StatsGrid({ items, columns = 4 }: StatsGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6`}>
      {items.map((item, idx) => (
        <StatItem key={idx} {...item} />
      ))}
    </div>
  );
}
