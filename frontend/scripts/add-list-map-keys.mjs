import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['fr', 'en', 'es', 'de', 'nl', 'pt'];

const fr = {
  missions: {
    foundSingle: 'mission trouvée',
    view: { list: 'Liste', map: 'Carte' },
  },
};
const en = {
  missions: {
    foundSingle: 'mission found',
    view: { list: 'List', map: 'Map' },
  },
};

function deepMergeOverwriteSpecific(target, source, overwriteKeys = new Set()) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (typeof target[key] !== 'object' || target[key] === null) target[key] = {};
      deepMergeOverwriteSpecific(target[key], source[key], overwriteKeys);
    } else {
      if (target[key] === undefined || overwriteKeys.has(key)) target[key] = source[key];
    }
  }
}

const overwrite = new Set(['list', 'map']); // overwrite the now-renamed view.* keys

for (const locale of LOCALES) {
  const file = path.join(localesDir, locale, 'translation.json');
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  deepMergeOverwriteSpecific(data, locale === 'fr' ? fr : en, overwrite);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`[ok] ${locale}`);
}
