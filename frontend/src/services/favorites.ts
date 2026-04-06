import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export const favoritesService = {
  async getFavorites(): Promise<any[]> {
    const token = getSessionToken();
    if (!token) return [];
    const user = await convexClient.query(api.auth.me, { token });
    if (!user) return [];
    const results = await convexClient.query(api.favorites.getMyFavorites, { userId: user._id });
    return results as any;
  },

  async addFavorite(projectId: number | string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const user = await convexClient.query(api.auth.me, { token });
    if (!user) throw new Error("Not authenticated");
    await convexClient.mutation(api.favorites.toggle, {
      userId: user._id,
      projectId: projectId as any,
    });
  },

  async removeFavorite(projectId: number | string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const user = await convexClient.query(api.auth.me, { token });
    if (!user) throw new Error("Not authenticated");
    await convexClient.mutation(api.favorites.toggle, {
      userId: user._id,
      projectId: projectId as any,
    });
  },

  async isFavorite(projectId: number | string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(projectId as any);
    } catch {
      return false;
    }
  },
};

export default favoritesService;
