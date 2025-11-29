import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';

// Languages sorted alphabetically by Latin name
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ru: { translation: ru },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_CODES,
    // Handle language codes like 'en-US' -> 'en'
    load: 'languageOnly',
    detection: {
      // Priority: 1) user's saved preference, 2) browser language, 3) html lang attribute
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Save user's language choice to localStorage
      caches: ['localStorage'],
      // Key name in localStorage
      lookupLocalStorage: 'i18nextLng',
      // Check these navigator properties for browser language
      lookupFromNavigatorLanguage: true,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
