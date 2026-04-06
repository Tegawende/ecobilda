// Languages are now loaded via Convex hooks (useLanguages from @/hooks/useConvex)
// This file is kept for backward compatibility.
import { convexClient } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Language } from '../types';

export const languagesService = {
  async getLanguages(): Promise<Language[]> {
    const results = await convexClient.query(api.languages.list);
    return results.map((l) => ({
      code: l.code,
      name: l.name,
    }));
  },
};
