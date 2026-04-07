'use client';

import { Users, AlertTriangle, TrendingUp, Plus, Zap, Activity, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardKpisProps {
  totalInQueue: number;
  criticalCount: number;
  systemLoad: string;
  onNewTriage: () => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtitle: string;
  iconColor: string;
}) {
  return (
    <div className="relative rounded-xl p-6 bg-card border border-border shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-300 group hover:border-primary/30">
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
            {label}
          </p>
          <p className="text-3xl font-black text-foreground tracking-tight leading-none mb-2">{value}</p>
          <p className="text-xs font-medium text-muted-foreground/60">{subtitle}</p>
        </div>
        <div className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-lg bg-muted/50 border border-border group-hover:border-primary/20 transition-colors`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardKpis({
  totalInQueue,
  criticalCount,
  systemLoad,
  onNewTriage,
}: DashboardKpisProps) {
  return (
    <div className="mb-10 space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield size={18} className="text-primary" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Triage Dashboard</h1>
          </div>
          <p className="text-[13px] text-muted-foreground font-medium ml-[48px] tracking-tight">Real-time clinical queue with AI-assisted triage assessment</p>
        </div>
        <Button
          onClick={onNewTriage}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 font-bold shadow-sm transition-all gap-2 h-11"
        >
          <Plus size={18} />
          New Clinical Triage
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label="Admission Queue"
          value={totalInQueue}
          subtitle="Patients awaiting review"
          iconColor="text-primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Triage"
          value={criticalCount}
          subtitle="Requires immediate attention"
          iconColor="text-orange-500"
        />
        <StatCard
          icon={Activity}
          label="Infrastructure Node"
          value={systemLoad}
          subtitle="NRT Processing: 1.2ms"
          iconColor="text-emerald-500"
        />
      </div>
    </div>
  );
}
