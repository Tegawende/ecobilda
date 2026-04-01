import api from './api';

export interface SavedSearch {
  id: number;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
}

export const searchesService = {
  async getSavedSearches(): Promise<SavedSearch[]> {
    const response = await api.get('/searches/');
    return response.data.results || response.data;
  },

  async saveSearch(name: string, filters: Record<string, unknown>): Promise<SavedSearch> {
    const response = await api.post('/searches/', { name, filters });
    return response.data;
  },

  async deleteSearch(id: number): Promise<void> {
    await api.delete(`/searches/${id}/`);
  },
};
