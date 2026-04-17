import { apiClient, apiFetch } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const eegService = {
  uploadEEG: async (file: File, patientId: string | number) => {
    const formData = new FormData();
    formData.append('patient_id', patientId.toString());
    formData.append('file', file);

    return apiClient.post('/eeg/upload', formData);
  },

  getAnalysis: async (studyId: string | number) => {
    return apiClient.get(`/eeg/${studyId}/analysis`);
  },
  
  getFullReport: async (studyId: string | number) => {
    return apiClient.get(`/eeg/${studyId}/report`);
  },
  
  getDownloadUrl: (studyId: string | number) => {
    return `${API_BASE}/eeg/${studyId}/download`;
  },
  
  getCSVDownloadUrl: (studyId: string | number) => {
    return `${API_BASE}/eeg/${studyId}/download/csv`;
  },
  
  getEDFDownloadUrl: (studyId: string | number) => {
    return `${API_BASE}/eeg/${studyId}/download/edf`;
  },
  
  getPDFReportUrl: (studyId: string | number) => {
    return `${API_BASE}/eeg/${studyId}/download/report-pdf`;
  }
};
