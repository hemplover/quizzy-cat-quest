
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

  // Translation function
  const t = (key: string): string => {
    if (!translations[language]) {
      console.warn(`Missing translations for language: ${language}, falling back to English`);
      return translations['en'][key] || key;
    }
    
    if (!translations[language][key]) {
      // Try lowercase version
      const lowercaseKey = key.toLowerCase();
      if (translations[language][lowercaseKey]) {
        return translations[language][lowercaseKey];
      }
      
      // Fallback to English if translation is missing
      if (language !== 'en' && translations['en'] && translations['en'][key]) {
        console.warn(`Translation missing for key: ${key} in language: ${language}, using English fallback`);
        return translations['en'][key];
      }
      
      // Also try lowercase in English
      if (language !== 'en' && translations['en'] && translations['en'][lowercaseKey]) {
        console.warn(`Translation missing for key: ${key} in language: ${language}, using English fallback (lowercase)`);
        return translations['en'][lowercaseKey];
      }
      
      // Return the key itself if no translation found
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      return key;
    }
    
    return translations[language][key];
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
