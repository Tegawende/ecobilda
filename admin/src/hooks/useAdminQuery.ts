import { useQuery } from "convex/react";
import { getSessionToken } from "@/lib/convexClient";
import type { FunctionReference } from "convex/server";

/**
 * Reactive Convex query with auto-injected admin token.
 * Skips the query if no token is available.
 */
export function useAdminQuery<T>(
  query: FunctionReference<"query", "public", { token: string } & Record<string, any>, T>,
  args?: Record<string, any>
) {
  const token = getSessionToken();
  return useQuery(query, token ? { token, ...args } : "skip") as T | undefined;
}
