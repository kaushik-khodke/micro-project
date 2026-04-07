'use client';

import { useState } from 'react';
import Header from '@/components/header';
import { Brain, Zap, BarChart3, TrendingUp, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EEGDetailPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const eegStudy = {
    id: 'EEG-20260407-001',
    patient: 'Arya',
    date: 'April 7, 2026',
    duration: '45 minutes',
    channels: 21,
    samplingRate: '250 Hz',
    status: 'Completed',
  };

  const bands = [
    {
      name: 'Delta (0.5-4 Hz)',
      power: 45.2,
      percentage: 18,
      significance: 'Normal - Associated with deep sleep',
    },
    {
      name: 'Theta (4-8 Hz)',
      power: 32.8,
      percentage: 13,
      significance: 'Normal - Meditation/drowsiness',
    },
    {
      name: 'Alpha (8-12 Hz)',
      power: 52.1,
      percentage: 21,
      significance: 'Normal - Relaxed wakefulness',
    },
    {
      name: 'Beta (12-30 Hz)',
      power: 65.4,
      percentage: 26,
      significance: 'Normal - Active thinking',
    },
    {
      name: 'Gamma (30-100 Hz)',
      power: 58.9,
      percentage: 22,
      significance: 'Normal - Cognitive processing',
    },
  ];

  const findings = [
    {
      severity: 'Low',
      title: 'Mild Focal Slowing',
      description: 'Slight theta predominance noted in right temporal region',
      confidence: '87%',
    },
    {
      severity: 'Normal',
      title: 'Normal Background Activity',
      description: 'Posterior dominant rhythm at 10 Hz, reactive to eye opening',
      confidence: '95%',
    },
    {
      severity: 'Normal',
      title: 'No Seizure Activity',
      description: 'No spikes, sharp waves, or seizure-like discharges detected',
      confidence: '99%',
    },
  ];

  const channels = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2', 'F7', 'F8', 'T3', 'T4', 'T5', 'T6', 'Fz', 'Cz', 'Pz', 'A1', 'A2'];

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="px-8 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">EEG Analysis</h1>
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Study ID</p>
                  <p className="font-semibold text-foreground">{eegStudy.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patient</p>
                  <p className="font-semibold text-foreground">{eegStudy.patient}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">{eegStudy.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {eegStudy.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 size={18} />
              </Button>
              <Button variant="outline" size="icon">
                <Download size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto">
          {['overview', 'spectral', 'channels', 'findings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Duration', value: eegStudy.duration },
              { label: 'Channels', value: eegStudy.channels },
              { label: 'Sampling Rate', value: eegStudy.samplingRate },
              { label: 'Signal Quality', value: 'Excellent' },
            ].map((stat, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'spectral' && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Frequency Band Analysis</h3>
            <div className="space-y-6">
              {bands.map((band, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{band.name}</p>
                      <p className="text-xs text-muted-foreground">{band.significance}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{band.power.toFixed(1)} µV²</p>
                      <p className="text-xs text-muted-foreground">{band.percentage}% of total</p>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${band.percentage * 2.5}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Channel Activity</h3>
            <div className="grid grid-cols-7 gap-2">
              {channels.map((channel) => (
                <div key={channel} className="rounded-lg border border-border bg-secondary/50 p-3 text-center hover:border-primary transition-colors cursor-pointer">
                  <p className="text-xs font-semibold text-foreground">{channel}</p>
                  <p className="text-xs text-muted-foreground mt-1">{Math.floor(Math.random() * 100)}µV</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-4">
            {findings.map((finding, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{finding.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{finding.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      finding.severity === 'Low' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {finding.severity}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {finding.confidence}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Recommendation */}
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 mt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
                    <Zap size={24} className="text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">Clinical Recommendation</p>
                  <p className="text-sm text-foreground">
                    EEG shows normal background activity with only minimal focal changes. No acute abnormalities detected. Recommend follow-up study if symptoms persist.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
