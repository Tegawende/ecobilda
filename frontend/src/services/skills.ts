// Skills are now loaded via Convex hooks (useSkills from @/hooks/useConvex)
// This file is kept for backward compatibility with any remaining imports.
import { convexClient } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Skill } from '../types';

export interface SkillFilters {
  lang?: 'en' | 'fr' | 'es' | 'de';
  category?: 'PERM' | 'NATB';
}

export const skillsService = {
  async getSkills(filters?: SkillFilters): Promise<Skill[]> {
    const results = await convexClient.query(api.skills.list, {
      category: filters?.category,
    });
    return results.map((s) => ({
      code: s.code,
      category: s.category as 'PERM' | 'NATB',
      displayNameEn: s.displayNameEn,
      displayNameFr: s.displayNameFr,
      displayNameEs: s.displayNameEs,
      displayNameDe: s.displayNameDe,
      displayNameNl: s.displayNameNl ?? '',
      displayNamePt: s.displayNamePt ?? '',
      icon: s.icon ?? '',
    }));
  },

  async getSkill(code: string): Promise<Skill | null> {
    const result = await convexClient.query(api.skills.getByCode, { code });
    if (!result) return null;
    return {
      code: result.code,
      category: result.category as 'PERM' | 'NATB',
      displayNameEn: result.displayNameEn,
      displayNameFr: result.displayNameFr,
      displayNameEs: result.displayNameEs,
      displayNameDe: result.displayNameDe,
      displayNameNl: result.displayNameNl ?? '',
      displayNamePt: result.displayNamePt ?? '',
      icon: result.icon ?? '',
    };
  },
};
