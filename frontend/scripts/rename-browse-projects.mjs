// Updates translation values for `browseProjects` keys to refer to missions instead of projects.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['fr', 'en', 'es', 'de', 'nl', 'pt'];

// Mapping per locale
const replacements = {
  fr: { 'projet': 'mission', 'projets': 'missions', 'Projet': 'Mission', 'Projets': 'Missions' },
  en: { 'project': 'mission', 'projects': 'missions', 'Project': 'Mission', 'Projects': 'Missions' },
  es: { 'proyecto': 'misión', 'proyectos': 'misiones', 'Proyecto': 'Misión', 'Proyectos': 'Misiones' },
  de: { 'Projekt': 'Mission', 'Projekte': 'Missionen' },
  nl: { 'project': 'missie', 'projecten': 'missies', 'Project': 'Missie', 'Projecten': 'Missies' },
  pt: { 'projeto': 'missão', 'projetos': 'missões', 'Projeto': 'Missão', 'Projetos': 'Missões' },
};

function applyReplacements(value, repl) {
  let out = value;
  for (const [from, to] of Object.entries(repl)) {
    // Whole-word boundary replacement
    const regex = new RegExp(`\\b${from}\\b`, 'g');
    out = out.replace(regex, to);
  }
  return out;
}

// Walk JSON object, when key === "browseProjects" or "browseMissions" or value contains the pattern, update
function walk(obj, repl) {
  if (Array.isArray(obj)) {
    obj.forEach((v) => walk(v, repl));
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === 'string' && (key === 'browseProjects' || key === 'browseMissions')) {
        obj[key] = applyReplacements(v, repl);
      } else {
        walk(v, repl);
      }
    }
  }
}

for (const locale of LOCALES) {
  const file = path.join(localesDir, locale, 'translation.json');
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  walk(data, replacements[locale]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`[ok] ${locale}`);
}
