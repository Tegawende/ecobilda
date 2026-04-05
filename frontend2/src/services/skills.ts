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
      display_name_en: s.displayNameEn,
      display_name_fr: s.displayNameFr,
      display_name_es: s.displayNameEs,
      display_name_de: s.displayNameDe,
      display_name_nl: s.displayNameNl ?? '',
      display_name_pt: s.displayNamePt ?? '',
      icon: s.icon ?? '',
    }));
  },

  async getSkill(code: string): Promise<Skill | null> {
    const result = await convexClient.query(api.skills.getByCode, { code });
    if (!result) return null;
    return {
      code: result.code,
      category: result.category as 'PERM' | 'NATB',
      display_name_en: result.displayNameEn,
      display_name_fr: result.displayNameFr,
      display_name_es: result.displayNameEs,
      display_name_de: result.displayNameDe,
      display_name_nl: result.displayNameNl ?? '',
      display_name_pt: result.displayNamePt ?? '',
      icon: result.icon ?? '',
    };
  },
};
