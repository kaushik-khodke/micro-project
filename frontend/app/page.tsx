'use client';

import { useState, useEffect } from 'react';
import DashboardKpis from '@/components/dashboard/kpis';
import PatientQueue from '@/components/dashboard/patient-queue';
import TriageModal from '@/components/modals/triage-modal';
import { triageService } from '@/services/triage';

export default function Page() {
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await triageService.getQueue();
      setPatients(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch queue', err);
      setError(err.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const total = patients.length;
    const critical = patients.filter((p) => p.severity === 'RED').length;
    const waiting = patients.filter((p) => p.status === 'PENDING' || p.status === 'ADMITTED').length;
    
    // Simple load index based on queue length
    let load = 'Low';
    if (total > 10) load = 'High';
    else if (total > 5) load = 'Moderate';
    
    return { total, critical, waiting, load };
  };

  const stats = getStats();

  useEffect(() => {
    fetchQueue();
    // Poll every 10 seconds to catch real-time EEG-triggered severity updates
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPatient = (newPatient: any) => {
    // Refresh queue after adding new patient
    fetchQueue();
    setShowTriageModal(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="px-8 py-6">
        <DashboardKpis
          totalInQueue={stats.total}
          criticalCount={stats.critical}
          systemLoad={stats.load}
          onNewTriage={() => setShowTriageModal(true)}
        />

        <PatientQueue patients={patients} onRefresh={fetchQueue} />

        {/* Triage Modal Integration */}
        {showTriageModal && (
          <TriageModal
            isOpen={showTriageModal}
            onClose={() => setShowTriageModal(false)}
            onSuccess={() => {
              setShowTriageModal(false);
              // Refresh the queue after successful triage
              fetchQueue();
            }}
          />
        )}
      </div>
    </main>
  );
}
