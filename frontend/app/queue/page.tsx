'use client';

import { useState } from 'react';
import { Filter, ChevronDown, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueuePatient {
  id: string;
  name: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  timeInQueue: number;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    spo2: number;
    temperature: number;
  };
  assignedTo?: string;
  notes: string;
}

export default function QueueManagementPage() {
  const [patients, setPatients] = useState<QueuePatient[]>([
    {
      id: '1',
      name: 'Arya',
      severity: 'ORANGE',
      timeInQueue: 120,
      vitals: { heartRate: 85, bloodPressure: '100/80', spo2: 90, temperature: 98 },
      assignedTo: 'Dr. Smith',
      notes: 'Hypoxemia alert, headache complaint',
    },
    {
      id: '2',
      name: 'John Doe',
      severity: 'RED',
      timeInQueue: 45,
      vitals: { heartRate: 105, bloodPressure: '140/95', spo2: 88, temperature: 101 },
      notes: 'Critical condition, fever + tachycardia',
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      severity: 'YELLOW',
      timeInQueue: 30,
      vitals: { heartRate: 72, bloodPressure: '115/70', spo2: 95, temperature: 98 },
      assignedTo: 'Nurse Johnson',
      notes: 'Stable, awaiting specialist review',
    },
    {
      id: '4',
      name: 'Michael Brown',
      severity: 'GREEN',
      timeInQueue: 15,
      vitals: { heartRate: 68, bloodPressure: '120/75', spo2: 98, temperature: 97 },
      notes: 'Stable vitals, routine assessment',
    },
  ]);

  const [sortBy, setSortBy] = useState<'severity' | 'timeInQueue'>('severity');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const getSortedAndFilteredPatients = () => {
    let filtered = patients;
    if (filterSeverity !== 'all') {
      filtered = filtered.filter((p) => p.severity === filterSeverity);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = { RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      } else {
        return b.timeInQueue - a.timeInQueue;
      }
    });
  };

  const severityColors = {
    RED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', light: 'bg-red-50' },
    ORANGE: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', light: 'bg-orange-50' },
    YELLOW: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', light: 'bg-yellow-50' },
    GREEN: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', light: 'bg-green-50' },
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <main className="min-h-screen bg-background">

      <div className="px-8 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Queue Management</h1>
          <p className="text-muted-foreground">Real-time patient queue prioritization and assignment</p>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total in Queue</p>
            <p className="text-2xl font-bold text-foreground">{patients.length}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs text-red-600 font-semibold mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-800">{patients.filter((p) => p.severity === 'RED').length}</p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs text-orange-600 font-semibold mb-1">High</p>
            <p className="text-2xl font-bold text-orange-800">{patients.filter((p) => p.severity === 'ORANGE').length}</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-xs text-yellow-600 font-semibold mb-1">Medium</p>
            <p className="text-2xl font-bold text-yellow-800">{patients.filter((p) => p.severity === 'YELLOW').length}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs text-green-600 font-semibold mb-1">Low</p>
            <p className="text-2xl font-bold text-green-800">{patients.filter((p) => p.severity === 'GREEN').length}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex gap-2">
            <Button variant={filterSeverity === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterSeverity('all')}>
              All
            </Button>
            {['RED', 'ORANGE', 'YELLOW', 'GREEN'].map((sev) => (
              <Button
                key={sev}
                variant={filterSeverity === sev ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity(sev)}
                className={filterSeverity === sev ? severityColors[sev as keyof typeof severityColors].bg : ''}
              >
                {sev}
              </Button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex gap-2">
            <Button
              variant={sortBy === 'severity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('severity')}
            >
              Sort by Severity
            </Button>
            <Button
              variant={sortBy === 'timeInQueue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('timeInQueue')}
            >
              Sort by Wait Time
            </Button>
          </div>
        </div>

        {/* Queue List */}
        <div className="space-y-3">
          {getSortedAndFilteredPatients().map((patient, idx) => {
            const colors = severityColors[patient.severity];
            return (
              <div
                key={patient.id}
                className={`rounded-lg border ${colors.border} ${colors.light} p-4 hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Index & Name */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {patient.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="col-span-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                      {patient.severity}
                    </span>
                  </div>

                  {/* Time in Queue */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatTime(patient.timeInQueue)}</p>
                        <p className="text-xs text-muted-foreground">Waiting</p>
                      </div>
                    </div>
                  </div>

                  {/* Vitals Summary */}
                  <div className="col-span-2">
                    <div className="text-xs space-y-0.5">
                      <p className="text-muted-foreground">HR: {patient.vitals.heartRate} | BP: {patient.vitals.bloodPressure}</p>
                      <p className="text-muted-foreground">SpO2: {patient.vitals.spo2}% | Temp: {patient.vitals.temperature}°F</p>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div className="col-span-2">
                    {patient.assignedTo ? (
                      <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-medium">
                        {patient.assignedTo}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="sm">
                      <ChevronDown size={16} />
                    </Button>
                  </div>
                </div>

                {/* Expandable Notes */}
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs text-foreground">
                    <AlertCircle className="inline mr-1" size={12} />
                    {patient.notes}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
