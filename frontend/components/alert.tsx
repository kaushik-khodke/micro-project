'use client';

import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ type, title, message, dismissible = false, onDismiss }: AlertProps) {
  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      title: 'text-green-900',
      message: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      title: 'text-red-900',
      message: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      title: 'text-yellow-900',
      message: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      title: 'text-blue-900',
      message: 'text-blue-800',
    },
  };

  const c = config[type];
  const IconComponent = c.icon;

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
      <div className="flex gap-4">
        <IconComponent size={20} className={`flex-shrink-0 ${c.iconColor} mt-0.5`} />
        <div className="flex-1">
          <p className={`font-semibold ${c.title}`}>{title}</p>
          <p className={`text-sm mt-1 ${c.message}`}>{message}</p>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-75"
          >
            <X size={18} className={c.iconColor} />
          </button>
        )}
      </div>
    </div>
  );
}
