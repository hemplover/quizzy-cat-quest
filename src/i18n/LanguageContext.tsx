
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations } from './translations';

// Export the Language type
export type Language = 'en' | 'it' | 'fr' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const defaultLanguage: Language = 'en';

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('quizzy_cat_language');
    return (savedLanguage as Language) || defaultLanguage;
  });

  // Translation function with enhanced fallback
  const t = (key: string): string => {
    // Check if translation exists for current language
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    
    // First fallback to English if translation is missing
    if (language !== 'en' && translations['en'] && translations['en'][key]) {
      console.warn(`Using English fallback for key: ${key} in language: ${language}`);
      return translations['en'][key];
    }
    
    // If English translation is also missing but we're specifically using English,
    // we want to avoid endless warnings, so just return the key
    if (language === 'en') {
      console.warn(`Translation missing for key: ${key} in English`);
      return key;
    }
    
    // Last resort fallback - return the key itself 
    console.warn(`Translation missing for key: ${key} in language: ${language}`);
    return key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('quizzy_cat_language', lang);
  };

  useEffect(() => {
    // Set document language attribute for accessibility
    document.documentElement.lang = language;
    
    // Set document title with translated app name
    const appName = t('appName');
    document.title = appName;
    
    // Update any meta tags that might contain the app name
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${appName} - ${t('uploadSubtitle')}`);
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
