import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export interface SavedSearch {
  _id: string;
  name: string;
  filters: Record<string, unknown>;
  _creationTime: string;
}

// Note: savedSearches table exists in schema but no Convex functions yet
// These are placeholder implementations using localStorage as fallback
export const searchesService = {
  async getSavedSearches(): Promise<SavedSearch[]> {
    // TODO: Implement via Convex query
    const saved = localStorage.getItem("ecobilda_saved_searches");
    return saved ? JSON.parse(saved) : [];
  },

  async saveSearch(name: string, filters: Record<string, unknown>): Promise<SavedSearch> {
    const search: SavedSearch = {
      _id: Date.now().toString(),
      name,
      filters,
      _creationTime: new Date().toISOString(),
    };
    const existing = await this.getSavedSearches();
    existing.push(search);
    localStorage.setItem("ecobilda_saved_searches", JSON.stringify(existing));
    return search;
  },

  async deleteSearch(id: number | string): Promise<void> {
    const existing = await this.getSavedSearches();
    const filtered = existing.filter((s) => s._id !== String(id));
    localStorage.setItem("ecobilda_saved_searches", JSON.stringify(filtered));
  },
};
