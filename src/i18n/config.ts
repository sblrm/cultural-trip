import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    debug: false,
    fallbackLng: 'id',
    supportedLngs: ['id', 'en', 'zh'],
    
    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    react: {
      useSuspense: false,
    },
  });

// Load translation files
const loadTranslations = async (lng: string) => {
  try {
    const response = await fetch(`/locales/${lng}/translation.json`);
    const translations = await response.json();
    i18n.addResourceBundle(lng, 'translation', translations);
  } catch (error) {
    console.error(`Failed to load translations for ${lng}:`, error);
  }
};

// Load all language translations
Promise.all([
  loadTranslations('id'),
  loadTranslations('en'),
  loadTranslations('zh'),
]);

export default i18n;
