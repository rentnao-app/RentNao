import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { aosFadeUp } from '../../lib/aos';
import { homeSectionContentMt, homeSectionInner, homeSectionPy } from './homeLayout';
import { useTranslation } from '../../lib/i18n';

function CompareIcon({ type }) {
  if (type === 'bad') {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626] sm:h-7 sm:w-7">
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8F4EE] text-[#2A7D4F] sm:h-7 sm:w-7">
      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
    </span>
  );
}

function CompareRowDesktop({ left, right, striped }) {
  return (
    <div
      className={`grid grid-cols-2 border-t border-[#e8f0eb] ${striped ? 'bg-[#f8fbf9]' : 'bg-white'}`}
    >
      <div className="flex items-start gap-2.5 px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
        <CompareIcon type="bad" />
        <p className="min-w-0 pt-0.5 text-sm leading-snug text-brand-muted sm:text-[0.9375rem]">{left}</p>
      </div>
      <div className="flex items-start gap-2.5 border-l border-[#e8f0eb] px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
        <CompareIcon type="good" />
        <p className="min-w-0 pt-0.5 text-sm font-semibold leading-snug text-brand-ink sm:text-[0.9375rem]">{right}</p>
      </div>
    </div>
  );
}

function CompareRowMobile({ left, right, traditionalLabel, rentNaoLabel }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#dfece4] bg-white shadow-[0_1px_2px_rgba(42,125,79,0.04)]">
      <div className="flex items-start gap-2.5 border-b border-[#eef5f0] bg-[#fefafa] px-3.5 py-3 sm:px-4 sm:py-3.5">
        <CompareIcon type="bad" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#b45309]">{traditionalLabel}</p>
          <p className="mt-0.5 text-sm leading-snug text-brand-muted">{left}</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3.5">
        <CompareIcon type="good" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#2A7D4F]">{rentNaoLabel}</p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-brand-ink">{right}</p>
        </div>
      </div>
    </article>
  );
}

export default function HomeComparisonSection() {
  const { t } = useTranslation();

  const rows = useMemo(
    () => [
      { left: t('home.compareRow1Left'), right: t('home.compareRow1Right') },
      { left: t('home.compareRow2Left'), right: t('home.compareRow2Right') },
      { left: t('home.compareRow3Left'), right: t('home.compareRow3Right') },
      { left: t('home.compareRow4Left'), right: t('home.compareRow4Right') },
      { left: t('home.compareRow5Left'), right: t('home.compareRow5Right') },
      { left: t('home.compareRow6Left'), right: t('home.compareRow6Right') },
      { left: t('home.compareRow7Left'), right: t('home.compareRow7Right') },
    ],
    [t]
  );

  return (
    <section
      className={`bg-white ${homeSectionPy}`}
      aria-labelledby="home-comparison-heading"
    >
      <div className={homeSectionInner}>
        <header className="mx-auto max-w-2xl text-center" {...aosFadeUp()}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A7D4F] sm:text-[0.8125rem]">
            {t('home.compareEyebrow')}
          </p>
          <h2
            id="home-comparison-heading"
            className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight text-brand-ink sm:text-3xl lg:text-[2rem]"
          >
            {t('home.compareTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">{t('home.compareSubtitle')}</p>
        </header>

        {/* Desktop / tablet table */}
        <div className={`mx-auto hidden max-w-3xl overflow-hidden rounded-2xl border border-[#dfece4] shadow-[0_8px_30px_-12px_rgba(42,125,79,0.18)] md:block ${homeSectionContentMt}`} {...aosFadeUp(100)}>
          <div className="grid grid-cols-2 bg-[#2A7D4F] text-white">
            <div className="flex items-center gap-2.5 px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </span>
              <p className="text-sm font-semibold sm:text-base">{t('home.compareTraditional')}</p>
            </div>
            <div className="flex items-center gap-2.5 border-l border-white/15 px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </span>
              <p className="text-sm font-semibold sm:text-base">{t('home.compareRentNao')}</p>
            </div>
          </div>

          {rows.map((row, index) => (
            <CompareRowDesktop key={row.left} left={row.left} right={row.right} striped={index % 2 === 1} />
          ))}
        </div>

        {/* Mobile stacked cards */}
        <div className={`space-y-3 md:hidden ${homeSectionContentMt}`} {...aosFadeUp(100)}>
          {rows.map((row) => (
            <CompareRowMobile
              key={row.left}
              left={row.left}
              right={row.right}
              traditionalLabel={t('home.compareTraditional')}
              rentNaoLabel={t('home.compareRentNao')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
