import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import en from 'date-fns/locale/en.js';
import es from 'date-fns/locale/es.js';
import hi from 'date-fns/locale/hi.js';

const LOCALE_MAP: Record<string, { locale: Locale; code: string }> = {
  en: { locale: en, code: 'en' },
  es: { locale: es, code: 'es' },
  hi: { locale: hi, code: 'hi' },
};

export const useDatePickerLocale = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage ?? i18n.language ?? 'en';

  return useMemo(() => {
    return LOCALE_MAP[currentLang] || LOCALE_MAP.en;
  }, [currentLang]);
};
