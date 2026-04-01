import api from './api';
import type { Skill } from '../types';

export interface SkillFilters {
  lang?: 'en' | 'fr' | 'es' | 'de';
  category?: 'PERM' | 'NATB';
}

export const skillsService = {
  // Get all skills with optional filters
  async getSkills(filters?: SkillFilters): Promise<Skill[]> {
    const response = await api.get('/skills/', { params: filters });
    return response.data;
  },

  // Get single skill by code
  async getSkill(code: string): Promise<Skill> {
    const response = await api.get(`/skills/${code}/`);
    return response.data;
  },
};
