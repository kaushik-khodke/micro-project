'use client';

import React, { useState } from 'react';
import { X, Brain, Shield, AlertCircle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

export interface EEGResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  fileName: string;
}

export default function EEGResultsModal({ isOpen, onClose, result, fileName }: EEGResultsModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !result) return null;

  const { details } = result;

  const handleExportPDF = async () => {
    if (!result.id) return;

    try {
      setIsExporting(true);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 15;

      const insight = details?.gemini_insight || {};
      const score = insight.confidence_score ?? details?.confidence ?? details?.model_score ?? 0;
      const pct = (score * 100).toFixed(1);
      const label = details?.prediction_label || 'N/A';

      // --- Helper functions ---
      const setColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        pdf.setTextColor(r, g, b);
      };
      const setFillColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        pdf.setFillColor(r, g, b);
      };
      const setDrawColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        pdf.setDrawColor(r, g, b);
      };

      const checkPageBreak = (needed: number) => {
        if (y + needed > pdf.internal.pageSize.getHeight() - 15) {
          pdf.addPage();
          y = 15;
        }
      };

      const wrapText = (text: string, maxW: number, fontSize: number): string[] => {
        pdf.setFontSize(fontSize);
        return pdf.splitTextToSize(text, maxW);
      };

      // --- Header background ---
      setFillColor('#4338ca');
      pdf.rect(0, 0, pageW, 38, 'F');

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      setColor('#ffffff');
      pdf.text('EEG Analysis Report', margin, 16);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      setColor('#c7d2fe');
      pdf.text(`NEURAL DIAGNOSTIC INTELLIGENCE  •  ${fileName.toUpperCase()}`, margin, 23);

      pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, 30);

      // NeuroBridge branding right
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      setColor('#e0e7ff');
      pdf.text('NeuroBridge AI', pageW - margin, 16, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('Clinical Decision Support', pageW - margin, 21, { align: 'right' });

      y = 48;

      // --- Prediction & Confidence row ---
      const boxW = (contentW - 6) / 2;
      
      // Prediction box
      setFillColor('#f8fafc');
      setDrawColor('#e2e8f0');
      pdf.roundedRect(margin, y, boxW, 28, 2, 2, 'FD');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      setColor('#64748b');
      pdf.text('PREDICTION LABEL', margin + 5, y + 7);

      const labelColor = label === 'ABNORMAL' ? '#dc2626' : label === 'BORDERLINE' ? '#d97706' : '#16a34a';
      // Colored dot
      setFillColor(labelColor);
      pdf.circle(margin + 7, y + 16, 2, 'F');
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      setColor(labelColor);
      pdf.text(label, margin + 12, y + 19);

      // Confidence box
      const confX = margin + boxW + 6;
      setFillColor('#f8fafc');
      setDrawColor('#e2e8f0');
      pdf.roundedRect(confX, y, boxW, 28, 2, 2, 'FD');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      setColor('#64748b');
      pdf.text('ANALYSIS CONFIDENCE', confX + 5, y + 7);

      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      setColor('#1e293b');
      pdf.text(`${pct}%`, confX + 5, y + 20);

      // Confidence bar
      const barY = y + 23;
      setFillColor('#e2e8f0');
      pdf.roundedRect(confX + 5, barY, boxW - 10, 2, 1, 1, 'F');
      const barColor = score >= 0.85 ? '#22c55e' : score >= 0.7 ? '#6366f1' : score >= 0.5 ? '#f59e0b' : '#ef4444';
      setFillColor(barColor);
      pdf.roundedRect(confX + 5, barY, (boxW - 10) * score, 2, 1, 1, 'F');

      y += 36;

      // --- Background / Technical / Risk row ---
      if (insight.background_activity || insight.technical_quality || insight.risk_level) {
        const colW = (contentW - 12) / 3;

        const infoBoxes = [
          { label: 'BACKGROUND ACTIVITY', value: insight.background_activity || 'N/A', color: '#334155' },
          { label: 'TECHNICAL QUALITY', value: insight.technical_quality || 'N/A', color: insight.technical_quality === 'Good' ? '#16a34a' : insight.technical_quality === 'Fair' ? '#d97706' : '#dc2626' },
          { label: 'RISK LEVEL', value: insight.risk_level || 'N/A', color: insight.risk_level === 'Critical' ? '#dc2626' : insight.risk_level === 'High' ? '#ea580c' : insight.risk_level === 'Moderate' ? '#d97706' : '#16a34a' },
        ];

        infoBoxes.forEach((box, i) => {
          const bx = margin + i * (colW + 6);
          setFillColor('#ffffff');
          setDrawColor('#e2e8f0');
          pdf.roundedRect(bx, y, colW, 22, 2, 2, 'FD');

          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'bold');
          setColor('#94a3b8');
          pdf.text(box.label, bx + 4, y + 6);

          const valLines = wrapText(box.value, colW - 8, 8);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          setColor(box.color);
          pdf.text(valLines.slice(0, 2), bx + 4, y + 12);
        });
        y += 28;
      }

      // --- Clinical Correlation ---
      if (insight.clinical_correlation) {
        checkPageBreak(22);
        setFillColor('#fffbeb');
        setDrawColor('#fde68a');
        pdf.roundedRect(margin, y, contentW, 18, 2, 2, 'FD');

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        setColor('#d97706');
        pdf.text('CLINICAL CORRELATION', margin + 5, y + 6);

        const corrLines = wrapText(insight.clinical_correlation, contentW - 10, 9);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        setColor('#92400e');
        pdf.text(corrLines.slice(0, 2), margin + 5, y + 12);
        y += 24;
      }

      // --- Summary ---
      if (insight.summary) {
        checkPageBreak(25);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        setColor('#4338ca');
        pdf.text('CLINICAL AI SUMMARY', margin, y);
        y += 5;

        setFillColor('#f8fafc');
        setDrawColor('#e2e8f0');
        const summaryLines = wrapText(insight.summary, contentW - 10, 10);
        const summaryH = Math.max(16, summaryLines.length * 5 + 8);
        pdf.roundedRect(margin, y, contentW, summaryH, 2, 2, 'FD');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        setColor('#334155');
        pdf.text(summaryLines, margin + 5, y + 7);
        y += summaryH + 6;
      }

      // --- Abnormal Patterns ---
      if (insight.abnormal_patterns?.length > 0) {
        checkPageBreak(10 + insight.abnormal_patterns.length * 6);
        setFillColor('#fef2f2');
        setDrawColor('#fecaca');
        const apH = 10 + insight.abnormal_patterns.length * 6;
        pdf.roundedRect(margin, y, contentW, apH, 2, 2, 'FD');

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        setColor('#dc2626');
        pdf.text('⚠  ABNORMAL PATTERNS DETECTED', margin + 5, y + 6);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        setColor('#991b1b');
        insight.abnormal_patterns.forEach((p: string, i: number) => {
          const lines = wrapText(`• ${p}`, contentW - 14, 9);
          pdf.text(lines[0], margin + 8, y + 12 + i * 6);
        });
        y += apH + 6;
      }

      // --- Key Findings & Clinical Flags side-by-side ---
      const hasFindings = insight.key_findings?.length > 0;
      const hasFlags = insight.clinical_flags?.length > 0;

      if (hasFindings || hasFlags) {
        checkPageBreak(30);
        const colW2 = hasFindings && hasFlags ? (contentW - 6) / 2 : contentW;

        // Key Findings
        if (hasFindings) {
          const fH = 10 + insight.key_findings.length * 6;
          checkPageBreak(fH);
          setFillColor('#f8fafc');
          setDrawColor('#e2e8f0');
          pdf.roundedRect(margin, y, colW2, fH, 2, 2, 'FD');

          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          setColor('#64748b');
          pdf.text('KEY FINDINGS', margin + 5, y + 6);

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          setColor('#475569');
          insight.key_findings.forEach((f: string, i: number) => {
            const lines = wrapText(`• ${f}`, colW2 - 12, 9);
            pdf.text(lines[0], margin + 8, y + 12 + i * 6);
          });

          if (hasFlags) {
            // Clinical Flags box on the right
            const flagH = 10 + insight.clinical_flags.length * 6;
            const maxH = Math.max(fH, flagH);

            setFillColor('#fef2f2');
            setDrawColor('#fecaca');
            pdf.roundedRect(margin + colW2 + 6, y, colW2, maxH, 2, 2, 'FD');

            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            setColor('#ef4444');
            pdf.text('CLINICAL FLAGS', margin + colW2 + 11, y + 6);

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            setColor('#991b1b');
            insight.clinical_flags.forEach((f: string, i: number) => {
              const lines = wrapText(`⚠ ${f}`, colW2 - 12, 9);
              pdf.text(lines[0], margin + colW2 + 14, y + 12 + i * 6);
            });

            y += maxH + 6;
          } else {
            y += fH + 6;
          }
        } else if (hasFlags) {
          const flagH = 10 + insight.clinical_flags.length * 6;
          checkPageBreak(flagH);
          setFillColor('#fef2f2');
          setDrawColor('#fecaca');
          pdf.roundedRect(margin, y, contentW, flagH, 2, 2, 'FD');

          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          setColor('#ef4444');
          pdf.text('CLINICAL FLAGS', margin + 5, y + 6);

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          setColor('#991b1b');
          insight.clinical_flags.forEach((f: string, i: number) => {
            const lines = wrapText(`⚠ ${f}`, contentW - 14, 9);
            pdf.text(lines[0], margin + 8, y + 12 + i * 6);
          });
          y += flagH + 6;
        }
      }

      // --- Recommended Action + Technical Validation ---
      checkPageBreak(24);
      const recW = (contentW - 6) / 2;
      
      // Recommended Action
      setFillColor('#eff6ff');
      setDrawColor('#bfdbfe');
      pdf.roundedRect(margin, y, recW, 20, 2, 2, 'FD');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      setColor('#1e40af');
      pdf.text('Recommended Action', margin + 5, y + 7);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      setColor('#1d4ed8');
      const recText = insight.recommended_action || (label === 'ABNORMAL'
        ? 'Urgent consultation with neurology recommended.'
        : 'Standard clinical follow-up as per routine protocol.');
      const recLines = wrapText(recText, recW - 10, 8);
      pdf.text(recLines.slice(0, 2), margin + 5, y + 13);

      // Technical Validation
      const tvX = margin + recW + 6;
      setFillColor('#fffbeb');
      setDrawColor('#fde68a');
      pdf.roundedRect(tvX, y, recW, 20, 2, 2, 'FD');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      setColor('#92400e');
      pdf.text('Technical Validation', tvX + 5, y + 7);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      setColor('#a16207');
      const tvLines = wrapText('AI analysis is a supportive tool. Clinical judgment by a board-certified physician is mandatory.', recW - 10, 8);
      pdf.text(tvLines.slice(0, 2), tvX + 5, y + 13);
      y += 26;

      // --- Confidence Note ---
      if (insight.confidence_note) {
        checkPageBreak(14);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        setColor('#94a3b8');
        const confNote = wrapText(`Confidence Note: ${insight.confidence_note}`, contentW, 7);
        pdf.text(confNote.slice(0, 2), margin, y);
        y += confNote.slice(0, 2).length * 3.5 + 4;
      }

      // --- Disclaimer ---
      checkPageBreak(14);
      setDrawColor('#e2e8f0');
      pdf.line(margin, y, pageW - margin, y);
      y += 4;
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'italic');
      setColor('#94a3b8');
      const discText = insight.disclaimer || 'This is an AI decision-support tool. It does not replace interpretation by a board-certified neurophysiologist.';
      const discLines = wrapText(discText, contentW, 6.5);
      pdf.text(discLines, margin, y);

      // Save
      pdf.save(`EEG_Report_${fileName.replace(/\.[^/.]+$/, '')}.pdf`);

    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col flex-1 overflow-hidden bg-white">
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
