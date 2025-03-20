
import React from 'react';
import { Language, useLanguage } from '@/i18n/LanguageContext';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (langCode: Language) => {
    if (langCode === language) return;
    
    setLanguage(langCode);
    
    // Show confirmation toast in the new language
    const newLang = languages.find(l => l.code === langCode);
    if (newLang) {
      setTimeout(() => {
        toast.success(`${newLang.flag} ${t('languageChanged')}`);
      }, 100); // Small delay to allow translations to update
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-cat/10 text-cat transition-colors">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden md:inline-block">
          {languages.find(lang => lang.code === language)?.name || t('language')}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer ${language === lang.code ? 'bg-cat/10 text-cat' : ''}`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
