import { useState, useEffect } from 'react';
import {
  CheckCircle, Loader2, Heart, Droplets, Wind,
  Thermometer, AlertTriangle, ChevronRight, Eye, Sparkles, Timer, AlertOctagon, Brain, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { triageService, TriageCase } from '@/services/triage';
import AnalysisModal from '@/components/modals/analysis-modal';
import { toast } from 'sonner';

interface PatientQueueProps {
  patients: TriageCase[];
  onRefresh?: () => void;
}

// Treatment time targets (in minutes) based on triage severity
const TREATMENT_TARGETS: Record<string, { minutes: number; label: string }> = {
  RED:    { minutes: 10,  label: 'Immediate' },
  ORANGE: { minutes: 30,  label: 'Urgent' },
  YELLOW: { minutes: 60,  label: 'Standard' },
  GREEN:  { minutes: 120, label: 'Non-urgent' },
};

function TriageCountdown({ arrivalTime, severity }: { arrivalTime: string; severity: string }) {
  // Use the component's mount time as the starting point so it "starts from 10" (or 30, 60, etc.)
  const [effectiveArrival] = useState(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const target = TREATMENT_TARGETS[severity] || TREATMENT_TARGETS.GREEN;
  const deadline = effectiveArrival + target.minutes * 60 * 1000;
  const remainingMs = deadline - now;
  const elapsedMs = now - effectiveArrival;
  const totalMs = target.minutes * 60 * 1000;

  const isOverdue = remainingMs <= 0;
  const progress = Math.min(elapsedMs / totalMs, 1);
  const isUrgent = !isOverdue && remainingMs < totalMs * 0.25;
  const isWarning = !isOverdue && !isUrgent && remainingMs < totalMs * 0.5;

  // SVG ring
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Colors
  const ringColor = isOverdue ? 'oklch(0.55 0.2 25)' : isUrgent ? 'oklch(0.55 0.2 25)' : isWarning ? 'oklch(0.75 0.15 60)' : 'oklch(0.6 0.15 150)';
  const bgStyle = isOverdue
    ? 'bg-destructive/5 border-destructive/20'
    : isUrgent ? 'bg-destructive/5 border-destructive/20'
    : isWarning ? 'bg-amber-500/5 border-amber-500/20'
    : 'bg-emerald-500/5 border-emerald-500/20';
  const textColor = isOverdue
    ? 'text-destructive'
    : isUrgent ? 'text-destructive'
    : isWarning ? 'text-amber-600'
    : 'text-emerald-600';

  // Format the time display
  let timeDisplay: string;
  let subLabel: string;

  if (isOverdue) {
    // Count UP — show how long past the deadline (live ticking)
    const overdueMs = now - deadline;
    const totalOverdueSecs = Math.floor(overdueMs / 1000);
    const oHrs = Math.floor(totalOverdueSecs / 3600);
    const oMins = Math.floor((totalOverdueSecs % 3600) / 60);
    const oSecs = totalOverdueSecs % 60;

    if (oHrs > 0) {
      timeDisplay = `+${oHrs}:${oMins.toString().padStart(2, '0')}:${oSecs.toString().padStart(2, '0')}`;
    } else {
      timeDisplay = `+${oMins.toString().padStart(2, '0')}:${oSecs.toString().padStart(2, '0')}`;
    }
    subLabel = `Overdue (${target.minutes}m target)`;
  } else {
    // Count DOWN — show remaining time
    const remainingSecs = Math.floor(remainingMs / 1000);
    const rMins = Math.floor(remainingSecs / 60).toString().padStart(2, '0');
    const rSecs = (remainingSecs % 60).toString().padStart(2, '0');
    timeDisplay = `${rMins}:${rSecs}`;
    subLabel = `${target.label} • ${target.minutes}m target`;
  }

  return (
    <div className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-lg border ${bgStyle} ${isOverdue || isUrgent ? 'animate-pulse' : ''}`}>
      {/* Circular progress ring */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeWidth="2" className="opacity-10" />
          <circle
            cx="22" cy="22" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isOverdue ? 0 : strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isOverdue ? (
            <AlertOctagon size={12} className="text-destructive" />
          ) : (
            <Timer size={12} className={textColor} />
          )}
        </div>
      </div>

      {/* Time display */}
      <div className="flex flex-col min-w-0">
        <span className={`text-base font-black tabular-nums tracking-tight leading-tight ${textColor}`}>
          {timeDisplay}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-widest leading-tight ${
          isOverdue ? 'text-red-500' : isUrgent ? 'text-red-400' : isWarning ? 'text-amber-500' : 'text-emerald-500'
        }`}>
          {subLabel}
        </span>
      </div>
    </div>
  );
}

function MiniVital({
  icon: Icon,
  label,
  value,
  unit,
  status,
}: {
  icon: any;
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}) {
  const colors = {
    normal: { dot: 'bg-emerald-500', text: 'text-foreground' },
    warning: { dot: 'bg-amber-500', text: 'text-amber-600' },
    critical: { dot: 'bg-destructive animate-pulse', text: 'text-destructive' },
  };
  const c = colors[status];

  return (
    <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
      <div className="flex items-center justify-between mb-1">
        <Icon size={12} className="text-muted-foreground/60" />
        <div className={`w-1 h-1 rounded-full ${c.dot}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-base font-black tracking-tight ${c.text}`}>{value || '--'}</span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{unit}</span>
      </div>
      <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

function getVitalStatus(key: string, value: any): 'normal' | 'warning' | 'critical' {
  if (!value || value === '--') return 'normal';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'normal';
  switch (key) {
    case 'heart_rate':
      if (num < 50 || num > 120) return 'critical';
      if (num < 60 || num > 100) return 'warning';
      return 'normal';
    case 'spo2':
      if (num < 90) return 'critical';
      if (num < 95) return 'warning';
      return 'normal';
    case 'temperature':
      if (num > 103 || num < 95) return 'critical';
      if (num > 100.4 || num < 97) return 'warning';
      return 'normal';
    default:
      return 'normal';
  }
}

export default function PatientQueue({ patients, onRefresh }: PatientQueueProps) {
  const [attendingId, setAttendingId] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<TriageCase | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'RED':
        return 'border-l-2 border-l-destructive bg-card';
      case 'ORANGE':
        return 'border-l-2 border-l-orange-500 bg-card';
      case 'YELLOW':
        return 'border-l-2 border-l-amber-500 bg-card';
      default:
        return 'border-l-2 border-l-emerald-500 bg-card';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'RED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'ORANGE':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'YELLOW':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  const handleAttended = async (caseId: number) => {
    try {
      setAttendingId(caseId);
      await triageService.updateStatus(caseId, 'TREATED');
      toast.success('Patient marked as attended');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to mark patient as attended');
    } finally {
      setAttendingId(null);
    }
  };

  const openAnalysis = (patient: TriageCase) => {
    setSelectedPatient(patient);
    setIsAnalysisOpen(true);
  };

  return (
    <div className="space-y-4">
      {patients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Sparkles size={24} className="text-slate-400" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No patients in the queue</p>
          <p className="text-sm text-slate-300 mt-1">New triage cases will appear here</p>
        </div>
      ) : (
        patients.map((patient, index) => {
          const insight = patient.clinical_insight;
          const insightObj = typeof insight === 'object' ? insight : null;
          const summaryText =
            typeof insight === 'string'
              ? insight
              : insightObj?.summary || null;
          const vitals = patient.vitals;

          return (
            <div
              key={patient.id}
              className={`rounded-xl border border-border p-0 transition-all hover:bg-muted/5 ${getSeverityStyle(
                patient.severity
              )} animate-fade-in`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Top Bar: Name + Severity + Time */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-foreground tracking-tight">{patient.patient_name}</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${getSeverityBadge(
                        patient.severity
                      )}`}
                    >
                      L{patient.severity === 'RED' ? '1' : patient.severity === 'ORANGE' ? '2' : patient.severity === 'YELLOW' ? '3' : '4'}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">MRN: {patient.mrn}</span>
                    {/* EEG-informed badge */}
                    {patient.clinical_insight?._eeg_informed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border bg-violet-50 text-violet-700 border-violet-200 animate-pulse">
                        <Brain size={9} />
                        EEG-Updated
                      </span>
                    )}
                    {/* EEG prediction badge when EEG report exists */}
                    {patient.eeg_report && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${
                        patient.eeg_report.prediction === 'ABNORMAL' ? 'bg-red-50 text-red-700 border-red-200' :
                        patient.eeg_report.prediction === 'BORDERLINE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <Zap size={9} />
                        EEG: {patient.eeg_report.prediction}
                      </span>
                    )}
                  </div>
                </div>
                <TriageCountdown arrivalTime={patient.arrival_time} severity={patient.severity} />
              </div>

              {/* Vitals Row */}
              {vitals && (
                <div className="px-6 py-3">
                  <div className="grid grid-cols-4 gap-2">
                    <MiniVital
                      icon={Heart}
                      label="HR"
                      value={vitals.heart_rate}
                      unit="bpm"
                      status={getVitalStatus('heart_rate', vitals.heart_rate)}
                    />
                    <MiniVital
                      icon={Droplets}
                      label="BP"
                      value={vitals.blood_pressure}
                      unit="mmHg"
                      status="normal"
                    />
                    <MiniVital
                      icon={Wind}
                      label="SpO₂"
                      value={vitals.spo2}
                      unit="%"
                      status={getVitalStatus('spo2', vitals.spo2)}
                    />
                    <MiniVital
                      icon={Thermometer}
                      label="Temp"
                      value={vitals.temperature}
                      unit="°F"
                      status={getVitalStatus('temperature', vitals.temperature)}
                    />
                  </div>
                </div>
              )}

              {/* Insight Section */}
              <div className="px-6 pb-4">
                <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 border border-primary/10 text-primary">
                      <Sparkles size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Clinical Insight Engine</span>
                    </div>
                    {insight && (
                      <div className="ml-auto flex items-center gap-1.5 opacity-60">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active Analyser</span>
                      </div>
                    )}
                  </div>

                  {summaryText ? (
                    <div className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">
                      <ReactMarkdown>{summaryText}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground/40">Initialising clinical sequence...</p>
                  )}

                  {/* Quick Flags inline */}
                  {insightObj?.clinical_flags && insightObj.clinical_flags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {insightObj.clinical_flags.slice(0, 3).map((flag: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive/5 text-destructive border border-destructive/10"
                        >
                          <AlertTriangle size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-tight">
                            {flag.length > 45 ? flag.slice(0, 45) + '...' : flag}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/5 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border border-border text-foreground hover:bg-muted font-bold text-[11px] gap-2 h-9"
                  onClick={() => openAnalysis(patient)}
                >
                  <Eye size={14} className="text-primary" />
                  Clinical Report
                  <ChevronRight size={14} className="text-muted-foreground" />
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg min-w-[140px] font-bold text-[11px] h-9 shadow-sm"
                  onClick={() => handleAttended(patient.id)}
                  disabled={attendingId === patient.id}
                >
                  {attendingId === patient.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={14} className="mr-1.5 text-emerald-200" />
                      Mark Protocol Complete
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })
      )}

      {/* Analysis Modal */}
      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        patient={selectedPatient}
      />
    </div>
  );
}
