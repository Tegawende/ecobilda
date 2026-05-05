// Adds missing i18n keys for the new mission filter UI + nav.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['fr', 'en', 'es', 'de', 'nl', 'pt'];

const fr = {
  home: { hero: { browseMissions: 'Parcourir les missions' } },
  nav: {
    missions: 'Missions',
    learnFromOthers: 'Apprenez des autres',
    userMenu: { myMissions: 'Mes missions', myPlaces: 'Mes lieux' },
  },
  common: { filter: 'Filtres', apply: 'Appliquer' },
  missions: {
    filters: {
      searchPlaceholder: 'Où allez-vous ?',
      searching: 'Recherche...',
      noResultsFor: 'Aucun résultat pour',
      dates: 'Dates',
      startingFrom: 'À partir du',
      all: 'Tous',
      paidOnly: 'Payant uniquement',
      amenities: 'Équipements',
      hoursPerDay: 'Heures par jour',
      daysPerWeek: 'Jours par semaine',
      maxParticipants: 'Nombre de participants',
    },
    view: { split: 'Liste + carte', grid: 'Liste' },
  },
};

const en = {
  home: { hero: { browseMissions: 'Browse missions' } },
  nav: {
    missions: 'Missions',
    learnFromOthers: 'Learn from others',
    userMenu: { myMissions: 'My missions', myPlaces: 'My places' },
  },
  common: { filter: 'Filters', apply: 'Apply' },
  missions: {
    filters: {
      searchPlaceholder: 'Where to?',
      searching: 'Searching…',
      noResultsFor: 'No results for',
      dates: 'Dates',
      startingFrom: 'Starting from',
      all: 'All',
      paidOnly: 'Paid only',
      amenities: 'Amenities',
      hoursPerDay: 'Hours per day',
      daysPerWeek: 'Days per week',
      maxParticipants: 'Number of participants',
    },
    view: { split: 'List + map', grid: 'List' },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (typeof target[key] !== 'object' || target[key] === null) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      // Set if missing OR if existing equals key fallback (i.e. we never set a real value)
      if (target[key] === undefined) target[key] = source[key];
    }
  }
}

for (const locale of LOCALES) {
  const file = path.join(localesDir, locale, 'translation.json');
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  deepMerge(data, locale === 'fr' ? fr : en);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`[ok] ${locale}`);
}
