// Adds new admin i18n keys for the place / mission rename.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['fr', 'en', 'es', 'de', 'nl', 'pt'];

const fr = {
  projects: {
    placeLabel: 'Lieu',
    missionsCount: 'missions',
    publishedShort: 'publiées',
  },
};
const en = {
  projects: {
    placeLabel: 'Place',
    missionsCount: 'missions',
    publishedShort: 'published',
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (typeof target[key] !== 'object' || target[key] === null) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
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
