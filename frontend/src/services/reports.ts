import api from './api';

export interface CreateReportData {
  content_type: 'project' | 'review' | 'user';
  object_id: number;
  reason: string;
  details?: string;
}

export const reportsService = {
  async createReport(data: CreateReportData): Promise<void> {
    await api.post('/reports/', data);
  },
};
