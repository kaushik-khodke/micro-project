'use client';

import { ReactNode } from 'react';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'red' | 'orange' | 'yellow' | 'green';
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, children, size = 'md' }: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const statusClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${statusClasses[status]}`}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' }) {
  const classes = {
    RED: 'bg-red-100 text-red-700',
    ORANGE: 'bg-orange-100 text-orange-700',
    YELLOW: 'bg-yellow-100 text-yellow-700',
    GREEN: 'bg-green-100 text-green-700',
  };

  const labels = {
    RED: 'Level 1 — RED',
    ORANGE: 'Level 2 — ORANGE',
    YELLOW: 'Level 3 — YELLOW',
    GREEN: 'Level 4 — GREEN',
  };

  return (
    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${classes[severity]}`}>
      {labels[severity]}
    </span>
  );
}
