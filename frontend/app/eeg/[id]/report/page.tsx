'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Download, FileText, Brain, Activity, 
  AlertCircle, ShieldAlert, CheckCircle2, Loader2, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eegService } from '@/services/eeg';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, Legend
} from 'recharts';

export default function EEGReportPage() {
  const params = useParams();
  const router = useRouter();
  const studyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await eegService.getFullReport(studyId);
        setReportData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load report. It may still be processing.");
      } finally {
        setLoading(false);
      }
    };
    if (studyId) fetchReport();
  }, [studyId]);

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Compiling Report Data</p>
       </div>
     );
  }

  if (error || !reportData) {
     return (
       <div className="p-8 max-w-4xl mx-auto mt-20 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl flex flex-col items-center">
             <AlertCircle size={48} className="mb-4 text-red-500" />
             <h2 className="text-xl font-bold mb-2">Report Unavailable</h2>
             <p className="mb-6">{error}</p>
             <Button onClick={() => router.push('/eeg')} variant="outline" className="bg-white">
                <ArrowLeft size={16} className="mr-2" /> Return to Pipeline
             </Button>
          </div>
       </div>
     );
  }

  const { metadata, insight, signal_analysis, chart_data, medical_insights, patient_summary } = reportData;
  const label = insight?.prediction_label || 'NORMAL';
  const confidence = insight?.confidence_score || insight?.confidence || 0;
  
  const handleDownload = (type: 'csv' | 'edf' | 'pdf') => {
    if (type === 'csv') {
      if (metadata.file_type === 'EDF') {
        window.open(eegService.getCSVDownloadUrl(studyId), '_blank');
      } else {
        if (!chart_data?.time_series || chart_data.time_series.length === 0) return;
        const keys = Object.keys(chart_data.time_series[0]);
        const csvContent = [
          keys.join(','),
          ...chart_data.time_series.map((row: any) => keys.map(k => row[k]).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `EEG_Chart_Data_${metadata.study_id || studyId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (type === 'edf') {
      window.open(eegService.getEDFDownloadUrl(studyId), '_blank');
    } else if (type === 'pdf') {
      window.open(eegService.getPDFReportUrl(studyId), '_blank');
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Top Navigation Frame */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => {
              window.close();
              setTimeout(() => router.push('/eeg'), 100);
            }}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Close Report
          </button>
          <div className="flex gap-2">
            {metadata.file_type === 'EDF' && (
               <Button onClick={() => handleDownload('edf')} variant="outline" size="sm" className="h-9 font-bold bg-white text-xs gap-1.5 focus:ring-2">
                 <Database size={14} /> Raw EDF
               </Button>
            )}
            <Button onClick={() => handleDownload('csv')} variant="outline" size="sm" className="h-9 font-bold bg-white text-xs gap-1.5">
              <FileText size={14} /> TimeSeries CSV
            </Button>
            <Button onClick={() => handleDownload('pdf')} className="h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5">
              <Download size={14} /> Clinical PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Section 1: Report Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
                <Brain size={24} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">EEG Analysis Report</h1>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Study ID: {metadata.study_id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-white p-4 rounded-xl border border-border shadow-sm">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source</p>
               <p className="text-sm font-black text-slate-800">{metadata.file_type}</p>
             </div>
             <div className="w-px h-8 bg-border" />
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
               <div className="flex items-center gap-1.5 text-emerald-600">
                 <CheckCircle2 size={14} /> <span className="text-sm font-black">Verified</span>
               </div>
             </div>
             <div className="w-px h-8 bg-border" />
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
               <p className="text-sm font-bold text-slate-800">{new Date(metadata.generated_at).toLocaleDateString()}</p>
             </div>
          </div>
        </header>

        {/* Section 2: Executive Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className={`col-span-1 lg:col-span-2 p-8 rounded-2xl border ${
             label === 'ABNORMAL' ? 'bg-red-50 border-red-200' : 
             label === 'BORDERLINE' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
           }`}>
             <div className="flex items-center gap-3 mb-6">
                <div className={`w-3 h-3 rounded-full ${
                   label === 'ABNORMAL' ? 'bg-red-500 animate-pulse' : 
                   label === 'BORDERLINE' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Primary Inference</h2>
             </div>
             <p className={`text-4xl font-black mb-4 ${
                label === 'ABNORMAL' ? 'text-red-700' : 
                label === 'BORDERLINE' ? 'text-amber-700' : 'text-emerald-700'
             }`}>
                {label} EEG PATTERN
             </p>
             <p className="text-slate-700 font-medium leading-relaxed max-w-2xl">
                {insight?.summary || patient_summary?.overview}
             </p>
           </div>

           <div className="col-span-1 p-8 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Model Confidence</p>
              <div className="flex items-end gap-2 mb-4">
                 <span className="text-5xl font-black text-slate-800">{(confidence * 100).toFixed(1)}</span>
                 <span className="text-xl font-bold text-slate-400 mb-1">%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                 <div 
                   className={`h-full rounded-full transition-all ${confidence > 0.8 ? 'bg-emerald-500' : confidence > 0.6 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                   style={{ width: `${confidence * 100}%` }}
                 />
              </div>
              <p className="text-xs font-bold text-slate-400">
                Risk Level: <span className={`uppercase font-black ${
                  insight?.risk_level === 'High' || insight?.risk_level === 'Critical' ? 'text-red-600' : 'text-slate-800'
                }`}>{insight?.risk_level || 'N/A'}</span>
              </p>
           </div>
        </section>

        {/* Section 3: Visual Graphs */}
        <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
           <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Signal Visualizations</h3>
              </div>
              {signal_analysis.source === 'SIMULATED' && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-200">
                   Simulated (Image/PDF Source)
                </span>
              )}
           </div>
           
           <div className="p-6 space-y-8">
              {/* Time Series */}
              {chart_data?.time_series?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-6">Time Series Tracing</h4>
                  <div className="h-[250px] w-full pr-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart_data.time_series}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time_ms" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                        <YAxis tick={false} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                          labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                        />
                        {/* Render channels with varying colors */}
                        {Object.keys(chart_data.time_series[0] || {}).filter(k => k !== 'time' && k !== 'time_ms').slice(0, 4).map((key, i) => (
                           <Line 
                             key={key} type="monotone" dataKey={key} 
                             stroke={['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'][i % 4]} 
                             strokeWidth={1.5} dot={false} isAnimationActive={false}
                           />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                {/* Frequency Radar */}
                {chart_data?.frequency_bands?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-6">Feature Band Distribution</h4>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chart_data.frequency_bands}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                          <Radar name="Power" dataKey="A" stroke="#6366f1" fill="#818cf8" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Channel Bar Chart */}
                {chart_data?.channel_comparison?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-6">Channel RMS Power</h4>
                    <div className="h-[250px] w-full pr-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart_data.channel_comparison} margin={{top: 10, right: 10, bottom: 0, left: 0}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                          <Bar dataKey="power" fill="#6366f1" radius={[4, 4, 0, 0]}>
                            {
                              chart_data.channel_comparison.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.power > 20 ? '#ef4444' : '#6366f1'} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </section>

        {/* Sections 4 & 5: Insights and Patient Comm */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Technical Medical Insights */}
           <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
             <div className="flex items-center gap-2 mb-6 text-indigo-600">
               <ShieldAlert size={18} />
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Clinical Insights</h3>
             </div>
             
             <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Background Pattern</p>
                  <p className="text-sm text-slate-700 font-medium">{medical_insights?.brain_patterns}</p>
                </div>
                
                {medical_insights?.irregular_signals?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Irregular Flags</p>
                    <ul className="space-y-2">
                       {medical_insights.irregular_signals.map((ir: string, i: number) => (
                         <li key={i} className="text-sm text-red-700 font-medium flex items-start gap-2">
                           <AlertCircle size={14} className="mt-0.5 shrink-0" /> {ir}
                         </li>
                       ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">State Indicators</p>
                  <ul className="space-y-1">
                     {medical_insights?.state_indicators?.map((si: string, i: number) => (
                       <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                         <span className="text-indigo-400 mt-0.5">•</span> {si}
                       </li>
                     ))}
                  </ul>
                </div>
             </div>
           </div>

           {/* Patient-Centric Summary */}
           <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Brain size={120} className="text-indigo-600" />
             </div>

             <div className="relative z-10">
               <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 mb-6 border-b border-indigo-200/50 pb-4">
                 Patient Summary
               </h3>
               
               <p className="text-lg font-bold text-indigo-950 mb-3">{patient_summary?.overview}</p>
               <p className="text-sm text-indigo-900/80 leading-relaxed mb-6">
                 {patient_summary?.explanation}
               </p>

               <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 mb-6 border border-white/50">
                 <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Key Observations</p>
                 <ul className="space-y-2">
                    {patient_summary?.observations?.map((obs: string, i: number) => (
                      <li key={i} className="text-sm text-indigo-900 flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-indigo-500 mt-0.5 shrink-0" /> {obs}
                      </li>
                    ))}
                 </ul>
               </div>

               <div className="bg-indigo-600 text-white p-5 rounded-xl">
                 <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5 ">Recommended Next Step</p>
                 <p className="text-sm font-medium">{patient_summary?.next_steps}</p>
               </div>
             </div>
           </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center">
           <p className="text-xs text-slate-400 font-medium">
             This automated report was generated as a clinical decision support tool.<br/>
             It does not substitute professional medical interpretation.
           </p>
        </footer>

      </div>
    </main>
  );
}
