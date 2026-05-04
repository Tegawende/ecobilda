import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export const favoritesService = {
  async getFavoriteMissionIds(): Promise<string[]> {
    const token = getSessionToken();
    if (!token) return [];
    const user = await convexClient.query(api.auth.me, { token });
    if (!user) return [];
    const results = await convexClient.query(api.favorites.getMyFavorites, { userId: user._id });
    return results as any;
  },

  async toggle(missionId: string): Promise<{ action: "added" | "removed" }> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const user = await convexClient.query(api.auth.me, { token });
    if (!user) throw new Error("Not authenticated");
    const res = await convexClient.mutation(api.favorites.toggle, {
      userId: user._id,
      missionId: missionId as any,
    });
    return res as any;
  },

  async isFavorite(missionId: string): Promise<boolean> {
    try {
      const ids = await this.getFavoriteMissionIds();
      return ids.includes(missionId);
    } catch {
      return false;
    }
  },
};

export default favoritesService;
