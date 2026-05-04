// ============================================
// Mission constants — client-side enums + i18n keys
// Mirror of frontend/convex/lib/missionConstants.ts (with i18n key suffixes).
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

// i18n key helpers — used in dropdowns and labels.
// Translation files contain entries under: missions.poste.<key>, missions.technique.<key>.
export function posteI18nKey(p: Poste): string {
  return `missions.poste.${p}`;
}
export function techniqueI18nKey(t: string): string {
  return `missions.technique.${t}`;
}
export function difficultyI18nKey(d: Difficulty): string {
  return `missions.difficulty.${d}`;
}
export function missionTypeI18nKey(t: MissionType): string {
  return `missions.types.${t}`;
}
export function missionStatusI18nKey(s: MissionStatus): string {
  return `missions.status.${s}`;
}
export function feedbackResultI18nKey(r: FeedbackResult): string {
  return `missionFeedback.result.${r}`;
}

export const POSTE_OPTIONS = POSTES.map((p) => ({ value: p, i18nKey: posteI18nKey(p) }));
export const DIFFICULTY_OPTIONS = DIFFICULTY_LEVELS.map((d) => ({
  value: d,
  i18nKey: difficultyI18nKey(d),
}));
export const MISSION_TYPE_OPTIONS = MISSION_TYPES.map((t) => ({
  value: t,
  i18nKey: missionTypeI18nKey(t),
}));
