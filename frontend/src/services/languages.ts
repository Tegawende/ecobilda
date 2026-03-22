import api from './api';
import type { Language } from '../types';

export const languagesService = {
  async getLanguages(): Promise<Language[]> {
    const response = await api.get('/languages/');
    return response.data;
  },
};
