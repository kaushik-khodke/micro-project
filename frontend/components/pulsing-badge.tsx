'use client';

export function PulsingBadge({ 
  children, 
  severity = 'orange' 
}: { 
  children: React.ReactNode; 
  severity?: 'red' | 'orange' | 'yellow'; 
}) {
  const severityClass = {
    red: 'severity-pulse-red',
    orange: 'severity-pulse-orange',
    yellow: 'bg-yellow-400',
  };

  return (
    <div className="relative inline-block">
      <span className={`inline-block ${severityClass[severity]} animate-pulse opacity-75 rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wider`}>
        {children}
      </span>
      <span className={`absolute inset-0 inline-block ${severityClass[severity]} rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wider`}>
        {children}
      </span>
    </div>
  );
}

export function CriticalIndicator() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-red-500"></div>
      <span className="text-xs font-semibold text-red-600">CRITICAL</span>
    </div>
  );
}

export function ActivityDot() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      <span className="text-xs text-muted-foreground">Live</span>
    </div>
  );
}
