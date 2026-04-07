'use client';

export function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
      <span className="text-xs font-semibold text-red-700">LIVE</span>
    </div>
  );
}

export function ProcessingBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
      <svg className="w-2 h-2 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75 text-blue-600" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-xs font-semibold text-blue-700">PROCESSING</span>
    </div>
  );
}

export function SuccessBadge({ text = 'Completed' }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
      <span className="w-2 h-2 rounded-full bg-green-500"></span>
      <span className="text-xs font-semibold text-green-700">{text.toUpperCase()}</span>
    </div>
  );
}

export function ErrorBadge({ text = 'Error' }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
      <span className="w-2 h-2 rounded-full bg-red-500"></span>
      <span className="text-xs font-semibold text-red-700">{text.toUpperCase()}</span>
    </div>
  );
}
