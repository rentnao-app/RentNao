import { useMemo } from 'react';
import { aosFadeUp, aosStagger } from '../../lib/aos';
import { homeSectionContentMt, homeSectionInner, homeSectionPy } from './homeLayout';
import { useTranslation } from '../../lib/i18n';

function WhyIcon({ type }) {
  const className = 'h-5 w-5 text-[#2A7D4F]';

  switch (type) {
    case 'pin':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" />
        </svg>
      );
    case 'shield':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3l7 3v5.5c0 4.6-2.9 8.8-7 10.5-4.1-1.7-7-5.9-7-10.5V6l7-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.5 12.5l1.8 1.8 3.5-3.6" />
        </svg>
      );
    case 'document':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 4h6l4 4v12a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14 4v4h4M10 13h6M10 17h4" />
        </svg>
      );
    case 'wallet':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v11a1 1 0 01-1 1H6.5A2.5 2.5 0 014 16.5v-9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 12h4M18.5 10.5v3" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H9l-4.5 3.5V6.5z" />
        </svg>
      );
    case 'camera':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 8.5V17a2 2 0 002 2h12a2 2 0 002-2V8.5a2 2 0 00-2-2h-2.1l-1.2-1.8A1 1 0 0013.9 4h-3.8a1 1 0 00-.8.4L7.9 6.5H6a2 2 0 00-2 2z" />
          <circle cx="12" cy="12.5" r="2.75" strokeWidth={1.75} />
        </svg>
      );
    case 'star':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 4.5l2.2 4.5 4.9.7-3.5 3.4.8 4.9L12 15.8l-4.4 2.3.8-4.9-3.5-3.4 4.9-.7L12 4.5z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function WhyBentoCard({ icon, title, description, className = '' }) {
  return (
    <article
      className={`group flex h-full flex-col rounded-2xl border border-[#d9ece3] bg-white p-5 shadow-[0_1px_2px_rgba(42,125,79,0.04)] transition duration-200 hover:border-brand-label/30 hover:shadow-[0_14px_36px_-14px_rgba(42,125,79,0.22)] sm:rounded-[1.25rem] sm:p-6 ${className}`}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#2A7D4F]/30 bg-[#E8F4EE] transition group-hover:border-[#2A7D4F]/45 group-hover:bg-[#dff0e8] sm:mb-5">
        <WhyIcon type={icon} />
      </div>
      <h3 className="text-base font-bold leading-snug text-brand-ink sm:text-[1.0625rem]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{description}</p>
    </article>
  );
}

export default function HomeWhySection() {
  const { t } = useTranslation();

  const cards = useMemo(
    () => [
      {
        id: 'listFree',
        icon: 'pin',
        gridClass: 'sm:col-span-2 lg:col-span-2',
        title: t('home.whyListFreeTitle'),
        description: t('home.whyListFreeDesc'),
      },
      {
        id: 'verifiedTenants',
        icon: 'shield',
        gridClass: 'sm:col-span-1 lg:col-span-1',
        title: t('home.whyVerifiedTenantsTitle'),
        description: t('home.whyVerifiedTenantsDesc'),
      },
      {
        id: 'digitalAgreements',
        icon: 'document',
        gridClass: 'sm:col-span-1 lg:col-span-1',
        title: t('home.whyDigitalAgreementsTitle'),
        description: t('home.whyDigitalAgreementsDesc'),
      },
      {
        id: 'autoRent',
        icon: 'wallet',
        gridClass: 'sm:col-span-1 lg:col-span-1',
        title: t('home.whyAutoRentTitle'),
        description: t('home.whyAutoRentDesc'),
      },
      {
        id: 'directComm',
        icon: 'chat',
        gridClass: 'sm:col-span-1 lg:col-span-1',
        title: t('home.whyDirectCommTitle'),
        description: t('home.whyDirectCommDesc'),
      },
      {
        id: 'mediaTours',
        icon: 'camera',
        gridClass: 'sm:col-span-1 lg:col-span-1',
        title: t('home.whyMediaToursTitle'),
        description: t('home.whyMediaToursDesc'),
      },
      {
        id: 'publicReviews',
        icon: 'star',
        gridClass: 'sm:col-span-1 lg:col-span-1',
        title: t('home.whyPublicReviewsTitle'),
        description: t('home.whyPublicReviewsDesc'),
      },
    ],
    [t]
  );

  return (
    <section className={`relative bg-[#fafcfb] ${homeSectionPy}`} aria-labelledby="home-why-heading">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#f6fbf8] to-transparent"
        aria-hidden
      />
      <div className={`relative ${homeSectionInner}`}>
        <header className="mx-auto max-w-2xl text-center" {...aosFadeUp()}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A7D4F] sm:text-[0.8125rem]">
            {t('home.whyEyebrow')}
          </p>
          <h2
            id="home-why-heading"
            className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight text-brand-ink sm:text-3xl lg:text-[2rem]"
          >
            {t('home.whyTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">{t('home.whySubtitle')}</p>
        </header>

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-5 ${homeSectionContentMt}`}>
          {cards.map((card, index) => (
            <div key={card.id} className={card.gridClass} {...aosFadeUp(aosStagger(index))}>
              <WhyBentoCard
                icon={card.icon}
                title={card.title}
                description={card.description}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
