import { apiClient, apiFetch } from "@/lib/api-client";

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
  
  getDownloadUrl: (studyId: string | number) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/eeg/${studyId}/download`;
  },
};
