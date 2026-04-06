import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export interface SavedSearch {
  _id: string;
  name: string;
  filters: Record<string, unknown>;
  _creationTime: number;
}

export const searchesService = {
  async getSavedSearches(): Promise<SavedSearch[]> {
    const token = getSessionToken();
    if (!token) return [];

    const results = await convexClient.query(api.savedSearches.list, { token });
    return results.map((r: any) => ({
      ...r,
      filters: JSON.parse(r.filters),
    }));
  },

  async saveSearch(name: string, filters: Record<string, unknown>): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    await convexClient.mutation(api.savedSearches.save, {
      token,
      name,
      filters: JSON.stringify(filters),
    });
  },

  async deleteSearch(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    await convexClient.mutation(api.savedSearches.remove, {
      token,
      id: id as any,
    });
  },
};
