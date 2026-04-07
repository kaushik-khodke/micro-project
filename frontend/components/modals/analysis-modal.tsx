'use client';

import React from 'react';
import {
  X, Shield, Activity, AlertCircle, CheckCircle2, TrendingUp,
  Brain, Heart, Thermometer, Wind, Droplets, AlertTriangle,
  Stethoscope, FileText, Sparkles, ChevronRight, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

function RiskMeter({ level }: { level: string }) {
  const normalizedLevel = level?.toLowerCase() || 'low';
  const levels = [
    { key: 'low', label: 'Low', color: 'bg-emerald-500', textColor: 'text-emerald-700', width: '25%' },
    { key: 'moderate', label: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-700', width: '50%' },
    { key: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700', width: '75%' },
    { key: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700', width: '100%' },
  ];

  const activeLevel = levels.find(l => normalizedLevel.includes(l.key)) || levels[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risk Assessment</span>
        <span className={`text-sm font-black uppercase tracking-wider ${activeLevel.textColor}`}>
          {activeLevel.label}
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${activeLevel.color} transition-all duration-1000 ease-out`}
          style={{ width: activeLevel.width }}
        />
      </div>
      <div className="flex justify-between">
        {levels.map((l) => (
          <span
            key={l.key}
            className={`text-[9px] font-bold uppercase tracking-wider ${
              l.key === activeLevel.key ? l.textColor : 'text-slate-300'
            }`}
          >
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function VitalCard({
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
  const statusConfig = {
    normal: {
      border: 'border-emerald-100',
      bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      dot: 'bg-emerald-500',
      label: 'Normal',
    },
    warning: {
      border: 'border-amber-100',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      dot: 'bg-amber-500',
      label: 'Attention',
    },
    critical: {
      border: 'border-red-100',
      bg: 'bg-gradient-to-br from-red-50 to-rose-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      dot: 'bg-red-500 animate-pulse',
      label: 'Critical',
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
          <Icon size={16} className={cfg.iconColor} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-slate-800">{value || '--'}</span>
        <span className="text-xs font-medium text-slate-400">{unit}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{cfg.label}</span>
      </div>
    </div>
  );
}

function getVitalStatus(label: string, value: any): 'normal' | 'warning' | 'critical' {
  if (!value || value === '--') return 'normal';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'normal';

  switch (label) {
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

export default function AnalysisModal({ isOpen, onClose, patient }: AnalysisModalProps) {
  if (!isOpen || !patient) return null;

  const insight = patient.clinical_insight || {};
  const vitals = patient.vitals || {};

  const severityGradient =
    patient.severity === 'RED'
      ? 'from-red-500 via-rose-500 to-red-600'
      : patient.severity === 'ORANGE'
      ? 'from-orange-400 via-amber-500 to-orange-500'
      : patient.severity === 'YELLOW'
      ? 'from-yellow-400 via-amber-400 to-yellow-500'
      : 'from-emerald-400 via-green-500 to-emerald-500';

  const severityLabel =
    patient.severity === 'RED' ? 'Immediate' :
    patient.severity === 'ORANGE' ? 'Urgent' :
    patient.severity === 'YELLOW' ? 'Semi-Urgent' : 'Non-Urgent';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-scale-in">
        
        {/* ─── HEADER ─── */}
        <div className={`relative p-6 bg-gradient-to-r ${severityGradient} text-white overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Stethoscope size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Health Insights Report</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium opacity-90">{patient.patient_name}</span>
                  <span className="text-xs opacity-70">•</span>
                  <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">MRN: {patient.mrn}</span>
                  <span className="text-xs opacity-70">•</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm">
                    {severityLabel}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* ── Section 1: Summary ── */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/80">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Sparkles size={16} className="text-blue-600" />
                </div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">What We Found</h3>
              </div>
              <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
                <ReactMarkdown>
                  {insight.summary || "Our AI system has analyzed your health data. A detailed summary will appear here after the analysis is complete."}
                </ReactMarkdown>
              </div>
            </div>

            {/* ── Section 2: Risk Level ── */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <RiskMeter level={insight.risk_level || 'low'} />
            </div>

            {/* ── Section 3: Your Vitals ── */}
            {vitals && Object.keys(vitals).length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Activity size={16} className="text-violet-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Your Vitals at a Glance</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <VitalCard
                    icon={Heart}
                    label="Heart Rate"
                    value={vitals.heart_rate}
                    unit="bpm"
                    status={getVitalStatus('heart_rate', vitals.heart_rate)}
                  />
                  <VitalCard
                    icon={Droplets}
                    label="Blood Pressure"
                    value={vitals.blood_pressure}
                    unit="mmHg"
                    status="normal"
                  />
                  <VitalCard
                    icon={Wind}
                    label="Oxygen (SpO₂)"
                    value={vitals.spo2}
                    unit="%"
                    status={getVitalStatus('spo2', vitals.spo2)}
                  />
                  <VitalCard
                    icon={Thermometer}
                    label="Temperature"
                    value={vitals.temperature}
                    unit="°F"
                    status={getVitalStatus('temperature', vitals.temperature)}
                  />
                </div>
              </div>
            )}

            {/* ── Section 4: Key Findings & Flags (side by side) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Findings */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  </div>
                  <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Key Findings</h4>
                </div>
                <div className="space-y-2.5">
                  {insight.key_findings?.length > 0 ? (
                    insight.key_findings.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-emerald-100/50">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <span className="text-[10px] font-black text-emerald-600">{i + 1}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug">{f}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm italic text-slate-400 py-2">No specific findings at this time.</p>
                  )}
                </div>
              </div>

              {/* Clinical Flags */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50/80 to-rose-50/50 border border-red-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle size={14} className="text-red-500" />
                  </div>
                  <h4 className="text-[11px] font-black text-red-600 uppercase tracking-widest">Things to Watch</h4>
                </div>
                <div className="space-y-2.5">
                  {insight.clinical_flags?.length > 0 ? (
                    insight.clinical_flags.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-red-100/50">
                        <div className="flex-shrink-0 mt-0.5">
                          <AlertCircle size={16} className="text-red-400" />
                        </div>
                        <p className="text-sm text-red-700 font-medium leading-snug">{f}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <p className="text-sm text-emerald-600 font-medium">No concerns flagged — all clear!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 5: EEG Report ── */}
            {patient.eeg_report && (
              <div className="rounded-2xl border border-indigo-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Brain size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Brain Activity (EEG)</h3>
                    <p className="text-[10px] text-indigo-200 font-medium">{patient.eeg_report.file_name}</p>
                  </div>
                  <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    patient.eeg_report.prediction === 'ABNORMAL'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {patient.eeg_report.prediction}
                  </span>
                </div>

                {patient.eeg_report.insight && (
                  <div className="p-5 space-y-4 bg-gradient-to-br from-indigo-50/50 to-white">
                    <div className="prose prose-indigo prose-sm max-w-none text-slate-600 bg-white rounded-xl p-4 border border-indigo-100/50">
                      <ReactMarkdown>
                        {typeof patient.eeg_report.insight === 'string'
                          ? patient.eeg_report.insight
                          : (patient.eeg_report.insight?.summary || "EEG analysis in progress...")}
                      </ReactMarkdown>
                    </div>

                    {typeof patient.eeg_report.insight === 'object' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {patient.eeg_report.insight.key_findings?.length > 0 && (
                          <div className="bg-white rounded-xl p-4 border border-indigo-100/50">
                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">EEG Findings</h4>
                            <ul className="space-y-2">
                              {patient.eeg_report.insight.key_findings.map((f: string, i: number) => (
                                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                  <ChevronRight size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {patient.eeg_report.insight.clinical_flags?.length > 0 && (
                          <div className="bg-white rounded-xl p-4 border border-red-100/50">
                            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Neuro Flags</h4>
                            <ul className="space-y-2">
                              {patient.eeg_report.insight.clinical_flags.map((f: string, i: number) => (
                                <li key={i} className="text-xs text-red-600 font-medium flex items-start gap-2">
                                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {typeof patient.eeg_report.insight === 'object' && patient.eeg_report.insight.recommended_action && (
                      <div className="p-4 rounded-xl bg-indigo-600 text-white">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">EEG Recommended Action</h4>
                        <p className="text-sm font-semibold leading-snug">{patient.eeg_report.insight.recommended_action}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Section 6: Recommended Next Step ── */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white overflow-hidden shadow-lg shadow-indigo-200/50">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="opacity-70" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">Recommended Next Step</h4>
                </div>
                <p className="text-lg font-bold leading-snug">
                  {insight.recommended_action || "Continue monitoring and follow standard triage protocol."}
                </p>
              </div>
            </div>

            {/* ── Disclaimer ── */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Shield size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {insight.disclaimer || "This AI-generated report is intended to support — not replace — professional clinical judgement. Always consult your healthcare provider for medical decisions."}
              </p>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={12} />
            <span className="text-[10px] font-medium">Generated by NeuroBridge AI</span>
          </div>
          <Button onClick={onClose} className="rounded-xl px-10 font-bold h-11 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}
