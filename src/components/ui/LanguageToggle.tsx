import { useTranslation } from 'react-i18next';

const LABELS: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  hi: 'हिंदी',
};

const LanguageToggle = ({ langs = ['en', 'es', 'hi'] }: { langs?: string[] }) => {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;
  return (
    <div className="flex items-center rounded-md border border-[var(--border-primary)] overflow-hidden text-[12px] font-medium">
      {langs.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => void i18n.changeLanguage(lng)}
          className={`px-2.5 py-1.5 transition-colors ${
            current === lng
              ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-pressed={current === lng}
        >
          {LABELS[lng] ?? lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
