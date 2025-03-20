
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';

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
    const savedLanguage = localStorage.getItem('app_language');
    return (savedLanguage as Language) || defaultLanguage;
  });

  // Translation function
  const t = (key: string): string => {
    if (!translations[language] || !translations[language][key]) {
      // Fallback to English if translation is missing
      if (language !== 'en' && translations['en'] && translations['en'][key]) {
        return translations['en'][key];
      }
      // Return the key itself if no translation found
      return key;
    }
    return translations[language][key];
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  useEffect(() => {
    // Set document language attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
