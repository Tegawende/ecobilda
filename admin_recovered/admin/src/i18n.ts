import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import esTranslation from './locales/es/translation.json';
import deTranslation from './locales/de/translation.json';
import ptTranslation from './locales/pt/translation.json';

const resources = {
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
  es: { translation: esTranslation },
  de: { translation: deTranslation },
  pt: { translation: ptTranslation },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('admin-language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
