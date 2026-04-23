import { apiClient } from '@/lib/api-client';

export interface Patient {
  id: string | number;
  name: string;
  age: number;
  mrn: string;
  gender?: string;
  contact_info?: string;
  lastVisit?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientCreate {
  name: string;
  age: number;
  mrn: string;
  gender?: string;
  contact_info?: string;
}

export const patientService = {
  async getPatients(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients');
  },

  async getPatient(id: string): Promise<Patient> {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  async createPatient(patient: PatientCreate): Promise<Patient> {
    return apiClient.post<Patient>('/patients', patient);
  },

  async updatePatient(id: string, patient: Partial<PatientCreate>): Promise<Patient> {
    return apiClient.patch<Patient>(`/patients/${id}`, patient);
  },

  async deletePatient(id: string): Promise<void> {
    return apiClient.delete(`/patients/${id}`);
  },
};
