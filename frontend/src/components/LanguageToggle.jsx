import { useTranslation } from '../lib/i18n';

const OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'bn', label: 'বাং' },
];

/**
 * Theme-matched EN / Bangla segmented toggle.
 * @param {boolean} compact - smaller variant for mobile header bar
 */
export default function LanguageToggle({ compact = false, className = '' }) {
  const { lang, setLang, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={`inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50/90 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${className}`}
    >
      {OPTIONS.map(({ code, label }) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            title={code === 'en' ? t('language.en') : t('language.bn')}
            className={`rounded-full font-semibold transition-all duration-200 ${
              compact ? 'px-2 py-1 text-[10px] sm:text-[11px]' : 'px-3 py-1.5 text-xs'
            } ${
              active
                ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100'
                : 'text-gray-500 hover:text-emerald-700'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
