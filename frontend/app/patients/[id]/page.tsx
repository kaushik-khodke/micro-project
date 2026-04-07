'use client';

import { useState } from 'react';
import Header from '@/components/header';
import {
  Heart, Zap, TrendingUp, Download, Share2, MessageCircle,
  Lock, Shield, Thermometer, Wind, Droplets,
  AlertTriangle, CheckCircle2, Sparkles, ChevronRight,
  Clock, FileText, Activity, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function RiskMeter({ level }: { level: string }) {
  const normalizedLevel = level?.toLowerCase() || 'moderate';
  const levels = [
    { key: 'low', label: 'Low', color: 'bg-emerald-500', textColor: 'text-emerald-700', width: '25%' },
    { key: 'moderate', label: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-700', width: '50%' },
    { key: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700', width: '75%' },
    { key: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700', width: '100%' },
  ];
  const activeLevel = levels.find(l => normalizedLevel.includes(l.key)) || levels[1];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risk Level</span>
        <span className={`text-sm font-black uppercase tracking-wider ${activeLevel.textColor}`}>
          {activeLevel.label}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${activeLevel.color} transition-all duration-1000 ease-out`}
          style={{ width: activeLevel.width }}
        />
      </div>
      <div className="flex justify-between">
        {levels.map((l) => (
          <span key={l.key} className={`text-[8px] font-bold uppercase tracking-wider ${l.key === activeLevel.key ? l.textColor : 'text-slate-200'}`}>
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
  const cfg = {
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
  }[status];

  return (
    <div className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
          <Icon size={16} className={cfg.iconColor} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black text-slate-800">{value}</span>
        <span className="text-xs font-medium text-slate-400">{unit}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{cfg.label}</span>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const patient = {
    id: '1',
    name: 'Arya',
    mrn: 'MRN-001234',
    age: 45,
    gender: 'Female',
    admittedAt: '2 hours ago',
    severity: 'ORANGE',
    status: 'In Queue',
    clinicalInsight:
      'The patient presents with a concerning SpO2 of 90% in conjunction with a headache. This level of hypoxemia requires prompt medical attention, even without further past medical history, to investigate the underlying cause and ensure adequate oxygenation.',
    confidence: '99%',
  };

  const vitals = [
    { label: 'Heart Rate', icon: Heart, value: 85, unit: 'bpm', status: 'normal' as const },
    { label: 'Blood Pressure', icon: Droplets, value: '100/80', unit: 'mmHg', status: 'normal' as const },
    { label: 'Oxygen (SpO₂)', icon: Wind, value: 90, unit: '%', status: 'warning' as const },
    { label: 'Temperature', icon: Thermometer, value: 98, unit: '°F', status: 'normal' as const },
  ];

  const aiAnalysis = [
    {
      finding: 'Hypoxemia Alert',
      severity: 'High',
      confidence: '98%',
      recommendation: 'Immediate oxygen therapy assessment required',
      detail: 'SpO2 at 90% is below the safe threshold. Supplemental oxygen should be considered while the underlying cause is investigated.',
    },
    {
      finding: 'Headache with Vital Sign Abnormalities',
      severity: 'Medium',
      confidence: '95%',
      recommendation: 'Consider neurological consultation',
      detail: 'The combination of headache and low oxygen saturation could indicate neurological involvement. Further assessment is recommended.',
    },
    {
      finding: 'Cardiovascular Stability',
      severity: 'Low',
      confidence: '92%',
      recommendation: 'Continuous heart rate monitoring',
      detail: 'Heart rate and blood pressure are within normal ranges. Continuous monitoring is recommended to detect changes early.',
    },
  ];

  const timeline = [
    { time: '2:15 PM', event: 'Patient arrived at facility', type: 'admission', icon: Stethoscope },
    { time: '2:20 PM', event: 'Vital signs recorded', type: 'vitals', icon: Activity },
    { time: '2:25 PM', event: 'AI triage assessment completed', type: 'ai', icon: Sparkles },
    { time: '2:28 PM', event: 'Assigned to care team', type: 'assignment', icon: CheckCircle2 },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'analysis', label: 'AI Analysis', icon: Sparkles },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="px-8 py-6">
        {/* ─── PATIENT HEADER ─── */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl font-black text-white tracking-tight">{patient.name}</h1>
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm text-white border border-white/20">
                    Level 2 — ORANGE
                  </span>
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-white">
                    {patient.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-8">
                  {[
                    { label: 'MRN', value: patient.mrn },
                    { label: 'Age / Gender', value: `${patient.age} / ${patient.gender}` },
                    { label: 'Admitted', value: patient.admittedAt },
                    { label: 'AI Confidence', value: patient.confidence },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-white/60 uppercase tracking-wider">{item.label}</p>
                      <p className="font-bold text-white text-lg">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Share2 size={18} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Download size={18} />
                </Button>
                <Button className="rounded-xl bg-white text-orange-600 hover:bg-white/90 font-bold">
                  <MessageCircle size={18} className="mr-2" />
                  Consult
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Vitals */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Activity size={16} className="text-violet-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Vital Signs</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vitals.map((vital, idx) => (
                    <VitalCard
                      key={idx}
                      icon={vital.icon}
                      label={vital.label}
                      value={vital.value}
                      unit={vital.unit}
                      status={vital.status}
                    />
                  ))}
                </div>
              </div>

              {/* Clinical Insight */}
              <div className="rounded-2xl overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Health Insight</h3>
                    <p className="text-[10px] text-blue-200 font-medium">Powered by NeuroBridge AI</p>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 border-t-0 rounded-b-2xl space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{patient.clinicalInsight}</p>

                  <div className="p-4 rounded-xl bg-white border border-slate-100">
                    <RiskMeter level="high" />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Lock size={13} className="text-slate-400" />
                      <p className="text-[10px] font-medium text-slate-400">HIPAA Compliant</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="text-slate-400" />
                      <p className="text-[10px] font-medium text-slate-400">Verified by AI Model v2.1</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <p className="text-[10px] font-bold text-emerald-600">Confidence: {patient.confidence}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm shadow-emerald-200">
                    <CheckCircle2 size={16} className="mr-2" />
                    Mark as Attended
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl font-semibold">
                    Request EEG
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl font-semibold">
                    Schedule Follow-up
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl font-semibold">
                    Transfer Patient
                  </Button>
                </div>
              </div>

              {/* Priority */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Priority Level</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all" />
                  </div>
                  <p className="text-lg font-black text-slate-800">75%</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Urgency score based on vitals & symptoms</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── ANALYSIS TAB ─── */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Sparkles size={16} className="text-indigo-600" />
              </div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">AI Analysis Findings</h3>
            </div>

            <div className="space-y-4">
              {aiAnalysis.map((finding, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-5 p-6">
                    {/* Severity indicator */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                      finding.severity === 'High'
                        ? 'bg-red-100'
                        : finding.severity === 'Medium'
                        ? 'bg-amber-100'
                        : 'bg-emerald-100'
                    }`}>
                      {finding.severity === 'High' ? (
                        <AlertTriangle size={22} className="text-red-500" />
                      ) : finding.severity === 'Medium' ? (
                        <Activity size={22} className="text-amber-500" />
                      ) : (
                        <CheckCircle2 size={22} className="text-emerald-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-black text-slate-800">{finding.finding}</h4>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            finding.severity === 'High'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : finding.severity === 'Medium'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          {finding.confidence} confidence
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed mb-3">{finding.detail}</p>

                      {/* Recommendation */}
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-blue-700">{finding.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Shield size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                These findings are generated by NeuroBridge AI to assist clinical decision-making. Always consult an attending physician for final diagnosis and treatment plans.
              </p>
            </div>
          </div>
        )}

        {/* ─── TIMELINE TAB ─── */}
        {activeTab === 'timeline' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Clock size={16} className="text-indigo-600" />
              </div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Patient Timeline</h3>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-violet-200" />

              <div className="space-y-0">
                {timeline.map((entry, idx) => {
                  const EntryIcon = entry.icon;
                  return (
                    <div key={idx} className="relative flex gap-5 pb-8 last:pb-0">
                      {/* Dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200/50">
                          <EntryIcon size={18} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-bold text-slate-800">{entry.event}</p>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">{entry.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── DOCUMENTS TAB ─── */}
        {activeTab === 'documents' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <FileText size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-400">No Documents Yet</h3>
            <p className="text-sm text-slate-300 mt-1">Reports and documents will appear here once generated</p>
          </div>
        )}
      </div>
    </main>
  );
}
