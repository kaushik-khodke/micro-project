'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  shadow?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ children, className = '', shadow = 'md', hover = false }: CardProps) {
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={`rounded-xl border border-border bg-card p-6 ${shadowClasses[shadow]} ${
        hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-border px-6 py-4 bg-secondary/50 ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h3 className={`text-lg font-bold text-foreground ${className}`}>{children}</h3>;
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}
