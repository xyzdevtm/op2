import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Locale } from './translations';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
};

const LanguageContext = createContext<LanguageContextType>({
  locale: 'fa',
  setLocale: () => {},
  t: (key: string) => key,
  dir: 'rtl',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('panel-locale');
    return (saved === 'fa' || saved === 'en' || saved === 'ar' || saved === 'tr' ? saved : 'fa') as Locale;
  });

  useEffect(() => {
    localStorage.setItem('panel-locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = (locale === 'fa' || locale === 'ar') ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (key: string) => translations[locale][key] || translations['en'][key] || key;

  const isRTL = locale === 'fa' || locale === 'ar';

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir: isRTL ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
