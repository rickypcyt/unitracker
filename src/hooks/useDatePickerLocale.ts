import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { hi } from 'date-fns/locale/hi';

export const withMondayStart = (locale: Locale): Locale => ({
  ...locale,
  options: { ...locale.options, weekStartsOn: 1 },
});

const LOCALE_MAP: Record<string, { locale: Locale; code: string }> = {
  en: { locale: withMondayStart(enUS), code: 'en' },
  es: { locale: withMondayStart(es), code: 'es' },
  hi: { locale: withMondayStart(hi), code: 'hi' },
};

export const useDatePickerLocale = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage ?? i18n.language ?? 'en';

  return useMemo(() => {
    return LOCALE_MAP[currentLang] ?? LOCALE_MAP['en'] ?? { locale: withMondayStart(enUS), code: 'en' };
  }, [currentLang]);
};
