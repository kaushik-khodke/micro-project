'use client';

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-4 bg-secondary rounded mb-4 w-1/2"></div>
      <div className="h-10 bg-secondary rounded mb-4 w-1/3"></div>
      <div className="space-y-2">
        <div className="h-2 bg-secondary rounded"></div>
        <div className="h-2 bg-secondary rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="animate-pulse p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-4 h-12 bg-secondary rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonLine() {
  return <div className="h-2 bg-secondary rounded animate-pulse"></div>;
}

export function SkeletonCircle() {
  return <div className="h-10 w-10 bg-secondary rounded-full animate-pulse"></div>;
}
