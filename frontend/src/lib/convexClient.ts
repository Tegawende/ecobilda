"use client";

import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

// HTTP client for imperative calls (mutations in event handlers)
export const convexClient = new ConvexHttpClient(convexUrl);

// Session token management (replaces JWT localStorage)
const SESSION_KEY = "convex_session_token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getSessionToken() !== null;
}
