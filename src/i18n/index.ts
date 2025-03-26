
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

// Initialize i18next with the translations
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translations.en
      },
      it: {
        translation: translations.it
      },
      fr: {
        translation: translations.fr
      },
      de: {
        translation: translations.de
      }
    },
    lng: localStorage.getItem('quizzy_cat_language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
