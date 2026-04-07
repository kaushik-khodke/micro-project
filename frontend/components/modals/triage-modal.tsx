'use client';

import React, { useState, useEffect } from 'react';
import { X, Mic, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triageService } from '@/services/triage';
import { patientService } from '@/services/patients';

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TriageModal({ isOpen, onClose, onSuccess }: TriageModalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    heartRate: '',
    bloodPressure: '',
    spo2: '',
    temperature: '',
    symptoms: '',
  });

  useEffect(() => {
    if (isOpen) {
      const fetchPatients = async () => {
        try {
          setLoadingPatients(true);
          const data = await patientService.getPatients();
          setPatients(data);
        } catch (err: any) {
          console.error('Failed to fetch patients', err);
        } finally {
          setLoadingPatients(false);
        }
      };
      fetchPatients();
    }
  }, [isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.patient_id) {
      setError('Please select a patient');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await triageService.admit({
        patient_id: parseInt(formData.patient_id),
        vitals: {
          heart_rate: parseInt(formData.heartRate) || 0,
          blood_pressure: formData.bloodPressure,
          spo2: parseInt(formData.spo2) || 0,
          temperature: parseFloat(formData.temperature) || 0.0,
        },
        symptoms: formData.symptoms,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Triage analysis failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <Shield size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">AI Triage</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Digital Clinical Assessment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Patient Identity */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
              Patient Identity
            </label>
            <div className="relative">
              <select
                disabled={loadingPatients || isSubmitting}
                value={formData.patient_id}
                onChange={(e: any) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-gray-50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none disabled:opacity-50"
              >
                <option value="">
                  {loadingPatients ? 'Loading patients...' : 'Select a registered patient...'}
                </option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Biometric Vital Signs */}
          <div>
            <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>⚡</span> BIOMETRIC VITAL SIGNS
            </label>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-2">HEART RATE</label>
                <input
                  type="number"
                  disabled={isSubmitting}
                  value={formData.heartRate}
                  onChange={(e: any) => setFormData({ ...formData, heartRate: e.target.value })}
                  placeholder="85"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-gray-50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">BPM</p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-2">BP</label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={formData.bloodPressure}
                  onChange={(e: any) => setFormData({ ...formData, bloodPressure: e.target.value })}
                  placeholder="120/80"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-gray-50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">mmHg</p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-2">SPO2</label>
                <input
                  type="number"
                  disabled={isSubmitting}
                  value={formData.spo2}
                  onChange={(e: any) => setFormData({ ...formData, spo2: e.target.value })}
                  placeholder="98"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-gray-50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">%</p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-2">TEMP</label>
                <input
                  type="number"
                  disabled={isSubmitting}
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e: any) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="98.6"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-gray-50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">°F</p>
              </div>
            </div>
          </div>

          {/* Symptoms & Chief Complaint */}
          <div>
            <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>📋</span> SYMPTOMS & CHIEF COMPLAINT
            </label>
            <div className="relative">
              <textarea
                disabled={isSubmitting}
                value={formData.symptoms}
                onChange={(e: any) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="Describe symptoms (e.g. Headache, Nausea, Dizziness)..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-gray-50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24 disabled:opacity-50"
              />
              <button
                type="button"
                className="absolute bottom-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Mic size={20} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              variant="outline"
              size="lg"
              className="flex-1 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground rounded-lg font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Calculate Urgency'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
