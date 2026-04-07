import { apiClient } from "@/lib/api-client";

export interface TriageCase {
  id: number;
  patient_name: string;
  mrn: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  status: 'PENDING' | 'ADMITTED' | 'TREATED' | 'DISCHARGED';
  arrival_time: string;
  vitals?: {
    heart_rate: number;
    blood_pressure: string;
    spo2: number;
    temperature: number;
  };
  symptoms?: string;
  clinical_insight?: {
    summary: string;
    risk_level: string;
    key_findings: string[];
    clinical_flags: string[];
    recommended_action: string;
    confidence_note: string;
    disclaimer: string;
  };
  eeg_report?: {
    id: number;
    file_name: string;
    prediction: string;
    insight: any;
  };
}

export interface TriageAnalyzeRequest {
  patient_id?: number;
  patient_info?: {
    name: string;
    age: number;
    mrn: string;
    gender: string;
  };
  vitals: {
    heart_rate: number;
    blood_pressure: string;
    spo2: number;
    temperature: number;
  };
  symptoms: string;
}

export const triageService = {
  analyze: async (data: TriageAnalyzeRequest) => {
    return apiClient.post('/triage/analyze', data);
  },

  admit: async (data: TriageAnalyzeRequest) => {
    return apiClient.post('/triage/admit', data);
  },

  getQueue: async (): Promise<TriageCase[]> => {
    return apiClient.get('/triage/queue');
  },

  updateStatus: async (caseId: number, status: string) => {
    return apiClient.patch(`/triage/${caseId}/status?status=${status}`);
  },
};
