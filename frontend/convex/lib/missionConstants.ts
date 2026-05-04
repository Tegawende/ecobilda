// ============================================
// Mission constants — server-side enums for validation
// Mirror of frontend/src/types/missions.ts (without i18n keys).
// Keep the two files in sync.
// ============================================

export const MISSION_TYPES = ["CHANTIER", "FORMATION"] as const;
export type MissionType = (typeof MISSION_TYPES)[number];

export const DIFFICULTY_LEVELS = ["DEBUTANT", "INTERMEDIAIRE", "EXPERT"] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export const PRICING_MODES = ["FREE", "PAID"] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export const MISSION_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export const FEEDBACK_RESULTS = ["SUCCESS", "PARTIAL_SUCCESS", "FAILURE"] as const;
export type FeedbackResult = (typeof FEEDBACK_RESULTS)[number];

export const POSTES = [
  "fondations",
  "murs",
  "toiture",
  "sol",
  "isolation",
  "enduits",
  "menuiseries",
  "exterieur",
  "autre",
] as const;
export type Poste = (typeof POSTES)[number];

export const TECHNIQUES_BY_POSTE: Record<Poste, readonly string[]> = {
  fondations: ["pierre", "beton", "pilotis", "pneu", "autre"],
  murs: [
    "paille_porteur",
    "paille_remplissage",
    "ossature_bois",
    "terre_crue",
    "brique_terre",
    "pierre",
    "parpaing",
    "autre",
  ],
  toiture: ["toit_vegetal", "ardoise", "tuile", "chaume", "bardeau_bois", "ondule", "autre"],
  sol: ["terre_battue", "beton_chanvre", "plancher_bois", "dalle_chaux", "dalle_argile", "autre"],
  isolation: [
    "paille",
    "laine_bois",
    "chanvre",
    "liege",
    "ouate_cellulose",
    "laine_mouton",
    "verre_expanse",
    "autre",
  ],
  enduits: ["terre", "chaux", "chaux_chanvre", "tadelakt", "platre", "autre"],
  menuiseries: ["bois_massif", "recup", "double_vitrage", "simple_vitrage", "autre"],
  exterieur: ["terrasse", "jardin_potager", "mare", "fosse", "recuperation_eau", "autre"],
  autre: [],
};

export function isValidPoste(value: string): value is Poste {
  return (POSTES as readonly string[]).includes(value);
}

export function isValidTechnique(poste: Poste, technique: string): boolean {
  const techniques = TECHNIQUES_BY_POSTE[poste];
  if (!techniques || techniques.length === 0) return false;
  return techniques.includes(technique);
}

// Mission lifecycle timing (in milliseconds)
export const FEEDBACK_NOTIFY_DELAY_MS = 24 * 60 * 60 * 1000; // 24h after endDate
export const FEEDBACK_REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
export const FEEDBACK_DEADLINE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
