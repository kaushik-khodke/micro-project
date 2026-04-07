'use client';

import React, { useRef, useState } from 'react';
import { X, Brain, Shield, AlertCircle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

import { eegService } from '@/services/eeg';

export interface EEGResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  fileName: string;
}

export default function EEGResultsModal({ isOpen, onClose, result, fileName }: EEGResultsModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !result) return null;

  const { details } = result;

  const handleExportPDF = async () => {
    if (!result.id) return;
    
    // If the original file was a PDF, the user likely wants to download THAT original file
    if (result.file_type === 'PDF') {
      try {
        setIsExporting(true);
        const downloadUrl = eegService.getDownloadUrl(result.id);
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file_name || `${fileName}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('File Download failed:', error);
      } finally {
        setIsExporting(false);
      }
      return;
    }

    // Default: Capture analysis report as PDF (especially for EDF files)
    if (!reportRef.current) return;
    
    try {
      setIsExporting(true);
      
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      } as any);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`EEG_Report_${fileName.replace(/\.[^/.]+$/, "")}.pdf`);
      
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div ref={reportRef} className="flex flex-col flex-1 overflow-hidden bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600">
                <Brain size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">EEG Analysis Report</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Neural Diagnostic Intelligence • {fileName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-full transition-colors print:hidden"
            >
              <X size={24} className="text-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Executive Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prediction Label</p>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    details?.prediction_label === 'ABNORMAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                    details?.prediction_label === 'BORDERLINE' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                    'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  }`} />
                  <span className={`text-2xl font-black ${
                    details?.prediction_label === 'ABNORMAL' ? 'text-red-700' : 
                    details?.prediction_label === 'BORDERLINE' ? 'text-amber-700' :
                    'text-green-700'
                  }`}>
                    {details?.prediction_label || 'NORMAL'}
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Analysis Confidence</p>
                {(() => {
                  const score = details?.gemini_insight?.confidence_score ?? details?.confidence ?? details?.model_score ?? 0;
                  const pct = (score * 100).toFixed(1);
                  const barColor = score >= 0.85 ? 'bg-green-500' : score >= 0.7 ? 'bg-indigo-500' : score >= 0.5 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-800">{pct}%</span>
                        <span className="text-xs text-slate-400 mb-1.5 font-bold">CONFIDENCE</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                      {details?.gemini_insight?.confidence_note && (
                        <p className="text-[10px] text-slate-400 mt-2 italic">{details.gemini_insight.confidence_note}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Image Analysis Extras (for EEG graph images) */}
            {details?.gemini_insight?.background_activity && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Background Activity</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{details.gemini_insight.background_activity}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Technical Quality</p>
                  <p className={`text-sm font-black ${
                    details.gemini_insight.technical_quality === 'Good' ? 'text-green-600' :
                    details.gemini_insight.technical_quality === 'Fair' ? 'text-amber-600' : 'text-red-600'
                  }`}>{details.gemini_insight.technical_quality || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Level</p>
                  <p className={`text-sm font-black ${
                    details.gemini_insight.risk_level === 'Critical' ? 'text-red-600' :
                    details.gemini_insight.risk_level === 'High' ? 'text-orange-600' :
                    details.gemini_insight.risk_level === 'Moderate' ? 'text-amber-600' : 'text-green-600'
                  }`}>{details.gemini_insight.risk_level || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Abnormal Patterns (Image Analysis) */}
            {details?.gemini_insight?.abnormal_patterns?.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> Abnormal Patterns Detected
                </h4>
                <ul className="space-y-2">
                  {details.gemini_insight.abnormal_patterns.map((p: string, i: number) => (
                    <li key={i} className="text-xs text-red-700 font-medium flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinical Correlation (Image Analysis) */}
            {details?.gemini_insight?.clinical_correlation && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Clinical Correlation</h4>
                <p className="text-sm text-amber-800 leading-relaxed">{details.gemini_insight.clinical_correlation}</p>
              </div>
            )}

            {/* AI Insights Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-4">
                <Shield size={20} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Clinical AI Insights</h3>
              </div>
              
              <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm shadow-indigo-100/20">
                <div className="prose prose-slate prose-sm max-w-none prose-headings:text-indigo-900 prose-strong:text-indigo-700 prose-p:text-slate-600 leading-relaxed">
                  <ReactMarkdown>
                    {typeof details?.gemini_insight === 'string' 
                      ? details.gemini_insight 
                      : (details?.gemini_insight?.summary || "Processing neural patterns for clinical context...")}
                  </ReactMarkdown>
                </div>

                {/* Structured Findings from Gemini */}
                {details?.gemini_insight && typeof details.gemini_insight === 'object' && (
                  <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {details.gemini_insight.key_findings && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Key Findings</h4>
                        <ul className="space-y-2">
                          {details.gemini_insight.key_findings.map((finding: string, i: number) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {details.gemini_insight.clinical_flags && (
                      <div>
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Clinical Flags</h4>
                        <ul className="space-y-2">
                          {details.gemini_insight.clinical_flags.map((flag: string, i: number) => (
                            <li key={i} className="text-xs text-red-600 font-medium flex items-start gap-2">
                              <span className="mt-0.5">⚠️</span>
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                <div className="text-blue-500 mt-1"><CheckCircle2 size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Recommended Action</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {details?.prediction_label === 'ABNORMAL' 
                      ? 'Urgent consultation with neurology recommended for diagnostic confirmation.' 
                      : 'Standard clinical follow-up as per routine protocol.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/50">
                <div className="text-amber-500 mt-1"><AlertCircle size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Technical Validation</p>
                  <p className="text-xs text-amber-700 mt-1">
                    AI analysis is a supportive tool. Clinical judgment by a board-certified physician is mandatory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-8">
            Close Report
          </Button>
          <Button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 relative overflow-hidden"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText size={16} className="mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
