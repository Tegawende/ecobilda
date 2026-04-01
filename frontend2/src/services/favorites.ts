import api from './api';

export const favoritesService = {
  // Get user's favorite projects
  async getFavorites(): Promise<number[]> {
    try {
      const response = await api.get('/favorites/');
      if (Array.isArray(response.data)) {
        return response.data.map((fav: any) => {
          if (typeof fav === 'number') return fav;
          return fav.project_id || fav.project || fav.id;
        });
      }
      const results = response.data.results || response.data || [];
      return results.map((fav: any) => {
        if (typeof fav === 'number') return fav;
        return fav.project_id || fav.project || fav.id;
      });
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Add project to favorites
  async addFavorite(projectId: number): Promise<void> {
    try {
      await api.post('/favorites/', { project: projectId });
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return;
      }
      throw error;
    }
  },

  // Remove project from favorites
  async removeFavorite(projectId: number): Promise<void> {
    try {
      await api.delete(`/favorites/by-project/${projectId}/`);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          await api.delete(`/favorites/${projectId}/`);
        } catch (err2: any) {
          if (err2?.response?.status !== 404) {
            throw err2;
          }
        }
      } else {
        throw error;
      }
    }
  },

  // Check if project is favorited
  async isFavorite(projectId: number): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(projectId);
    } catch {
      return false;
    }
  },
};

export default favoritesService;
