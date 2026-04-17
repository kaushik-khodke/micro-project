'use client';

import { useState, useEffect } from 'react';
import {
  Upload, Brain, BarChart3, FileText, Loader2, AlertCircle,
  Sparkles, CheckCircle2, CloudUpload, Zap, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { eegService } from '@/services/eeg';
import { patientService } from '@/services/patients';

import type { EEGResultsModalProps } from '@/components/modals/eeg-results-modal';

const EEGResultsModal = dynamic<EEGResultsModalProps>(() => import('@/components/modals/eeg-results-modal'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-sm"><Loader2 size={32} className="animate-spin text-primary" /></div>
});

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
    <div className="relative rounded-lg p-6 bg-card border border-border shadow-sm transition-all duration-300 group hover:border-primary/30">
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-black text-foreground tracking-tight leading-none mb-2">{value}</p>
          <p className="text-xs font-medium text-muted-foreground/60">{subtitle}</p>
        </div>
        <div className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-lg bg-muted/50 border border-transparent group-hover:border-primary/10 transition-colors`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

export default function EEGPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [activeFileName, setActiveFileName] = useState<string>('');
  const [fetchingResultId, setFetchingResultId] = useState<string | number | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoadingPatients(true);
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setGlobalError('Could not load patients. Please refresh.');
      } finally {
        setIsLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (!selectedPatientId) {
      setGlobalError('Please select a patient before uploading EEG files.');
      return;
    }

    setGlobalError(null);

    for (const file of files) {
      const tempId = Date.now() + Math.random();
      const newFileObj = {
        id: tempId,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        type: file.type,
        uploadedAt: new Date().toLocaleString(),
        status: 'uploading',
        progress: 10,
      };

      setUploadedFiles(prev => [newFileObj, ...prev]);

      try {
        const response = await eegService.uploadEEG(file, selectedPatientId);
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId ? { 
            ...f, 
            id: response.study_id,
            status: 'PROCESSING',
            progress: 50 
          } : f
        ));

        if (response.study_id) {
          startPolling(response.study_id);
        }

      } catch (err) {
        console.error('Upload failed:', err);
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId ? { ...f, status: 'failed', error: 'Upload failed' } : f
        ));
      }
    }
  };

  const startPolling = (fileId: string) => {
    const interval = setInterval(async () => {
      try {
        const analysis = await eegService.getAnalysis(fileId);
        const status = (analysis.status || '').toUpperCase();
        
        if (status === 'COMPLETED') {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'COMPLETED', progress: 100, analysis } : f
          ));
          clearInterval(interval);
        } else if (status === 'FAILED') {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'FAILED', error: analysis.error || 'Processing Failed' } : f
          ));
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  const handleViewResults = async (file: any) => {
    setActiveFileName(file.name);
    setFetchingResultId(file.id);
    try {
      const data = await eegService.getAnalysis(file.id);
      setSelectedAnalysis({ ...data, id: file.id });
      setIsResultModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
      setGlobalError('Could not retrieve analysis report. Please try again.');
    } finally {
      setFetchingResultId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: 'Complete' };
      case 'FAILED':
      case 'failed':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle, label: 'Failed' };
      default:
        return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Loader2, label: 'Processing' };
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1 border-b border-border pb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">EEG Analysis Node</h1>
              <p className="text-[13px] text-muted-foreground font-medium tracking-tight">Cortex imaging & autonomous signal interpretation sequence</p>
            </div>
          </div>
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 animate-fade-in">
            <AlertCircle size={18} />
            <p className="text-sm font-semibold">{globalError}</p>
            <button onClick={() => setGlobalError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs font-bold">Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            icon={CloudUpload}
            label="Study Ingestion"
            value={uploadedFiles.length}
            subtitle="Total datasets synchronised"
            iconColor="text-primary"
          />
          <StatCard
            icon={CheckCircle2}
            label="Analysis Complete"
            value={uploadedFiles.filter(f => f.status === 'COMPLETED').length}
            subtitle="Diagnostic reports generated"
            iconColor="text-emerald-500"
          />
          <StatCard
            icon={Zap}
            label="Inference Queue"
            value={uploadedFiles.filter(f => ['PROCESSING', 'uploading'].includes(f.status)).length}
            subtitle="Active neural computations"
            iconColor="text-amber-500"
          />
        </div>

        {/* Upload Area */}
        <div className="bg-card rounded-xl border border-border p-8 mb-10 shadow-sm">
          {/* Patient Select */}
          <div className="max-w-md mb-10">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[10px] font-black text-primary px-2 py-0.5 border border-primary/20 rounded bg-primary/5 uppercase tracking-widest">
                Step 1
              </span>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Patient Association
              </label>
            </div>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              disabled={isLoadingPatients}
              className="w-full px-4 py-3 rounded-lg border border-border bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 appearance-none disabled:opacity-50 text-sm font-medium transition-all"
            >
              <option value="">Select registry entry...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — [MRN: {p.mrn}]
                </option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-[10px] font-black text-primary px-2 py-0.5 border border-primary/20 rounded bg-primary/5 uppercase tracking-widest">
              Step 2
            </span>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              Neuro-Signal Ingestion
            </label>
            <span className="text-[9px] font-medium text-muted-foreground/40 ml-1">(.EDF, .PNG, .JPG)</span>
          </div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.002]'
                : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/[0.02]'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all ${
                isDragging ? 'bg-primary/20' : 'bg-muted/50'
              }`}>
                <CloudUpload size={24} className={isDragging ? 'text-primary' : 'text-muted-foreground/60'} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1 tracking-tight">Drop neuro-telemetry files here</h3>
              <p className="text-xs text-muted-foreground/60 mb-6">Autonomous mapping will initiate upon synchronisation</p>
              <label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".edf,.pdf,.png,.jpg,.jpeg"
                />
                <Button asChild className="cursor-pointer pointer-events-none rounded-lg bg-primary hover:bg-primary/90 font-bold shadow-sm px-8 h-10 gap-2">
                  <span>
                    <Upload size={14} />
                    Protocol Ingest
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border px-6 py-5 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-3">
                <Sparkles size={14} className="text-primary" />
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-[0.2em]">Neural Signal Queue</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded border border-border">
                {uploadedFiles.length} node{uploadedFiles.length !== 1 ? 's' : ''} synchronised
              </span>
            </div>
            <div className="divide-y divide-border">
              {uploadedFiles.map((file, index) => {
                const statusCfg = getStatusConfig(file.status);
                const StatusIcon = statusCfg.icon;
                const isProcessing = file.status === 'uploading' || file.status === 'PROCESSING' || file.status === 'processing';

                return (
                  <div
                    key={file.id}
                    className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/10 transition-colors animate-fade-in gap-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 border border-border flex items-center justify-center`}>
                        {file.status === 'COMPLETED' ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : file.status === 'FAILED' || file.status === 'failed' ? (
                          <AlertCircle size={18} className="text-destructive" />
                        ) : (
                          <Loader2 size={18} className="text-primary animate-spin" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-foreground tracking-tight">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5 opacity-60">
                          {file.size} MB • {file.uploadedAt}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <StatusIcon size={12} className={`${statusCfg.color} ${isProcessing && StatusIcon !== Loader2 ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="w-32 bg-muted rounded-full h-1 overflow-hidden border border-border/50">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            file.status === 'COMPLETED' ? 'bg-emerald-500' : 
                            file.status === 'FAILED' || file.status === 'failed' ? 'bg-destructive' : 'bg-primary'
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      
                      {/* Action */}
                      <div className="flex justify-end min-w-[240px] gap-2">
                        {file.status === 'COMPLETED' ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-primary border-primary/20 hover:bg-primary/5 rounded-lg font-bold text-[10px] h-8 gap-1.5 px-3"
                              onClick={() => handleViewResults(file)}
                              disabled={fetchingResultId === file.id}
                            >
                              {fetchingResultId === file.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <>
                                  <Sparkles size={12} />
                                  Quick Insight
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-[10px] h-8 gap-1.5 px-4 shadow-sm"
                              onClick={() => window.open(`/eeg/${file.id}/report`, '_blank')}
                            >
                              <BarChart3 size={12} />
                              Full Report
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" disabled={file.status !== 'FAILED' && file.status !== 'failed'} className="rounded-lg text-[10px] font-bold h-8 border-border">
                            {isProcessing ? (
                              <Loader2 size={12} className="animate-spin text-primary" />
                            ) : 'Retry Session'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal */}
        <EEGResultsModal 
          isOpen={isResultModalOpen} 
          onClose={() => setIsResultModalOpen(false)} 
          result={selectedAnalysis} 
          fileName={activeFileName}
        />
      </div>
    </main>
  );
}
