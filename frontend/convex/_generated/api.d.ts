/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_contacts from "../admin/contacts.js";
import type * as admin_dashboard from "../admin/dashboard.js";
import type * as admin_projects from "../admin/projects.js";
import type * as admin_reports from "../admin/reports.js";
import type * as admin_users from "../admin/users.js";
import type * as auth from "../auth.js";
import type * as contact from "../contact.js";
import type * as conversations from "../conversations.js";
import type * as countries from "../countries.js";
import type * as cronHandlers from "../cronHandlers.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as favorites from "../favorites.js";
import type * as languages from "../languages.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as participations from "../participations.js";
import type * as projects from "../projects.js";
import type * as reports from "../reports.js";
import type * as reviews from "../reviews.js";
import type * as savedSearches from "../savedSearches.js";
import type * as seed from "../seed.js";
import type * as skills from "../skills.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/contacts": typeof admin_contacts;
  "admin/dashboard": typeof admin_dashboard;
  "admin/projects": typeof admin_projects;
  "admin/reports": typeof admin_reports;
  "admin/users": typeof admin_users;
  auth: typeof auth;
  contact: typeof contact;
  conversations: typeof conversations;
  countries: typeof countries;
  cronHandlers: typeof cronHandlers;
  crons: typeof crons;
  emails: typeof emails;
  favorites: typeof favorites;
  languages: typeof languages;
  messages: typeof messages;
  notifications: typeof notifications;
  participations: typeof participations;
  projects: typeof projects;
  reports: typeof reports;
  reviews: typeof reviews;
  savedSearches: typeof savedSearches;
  seed: typeof seed;
  skills: typeof skills;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
