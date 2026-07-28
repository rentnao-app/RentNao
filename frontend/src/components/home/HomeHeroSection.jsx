import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserRole, isLoggedIn } from '../../lib/api';
import { aosFadeLeft, aosFadeUp } from '../../lib/aos';
import { homeHeroPy, homeSectionContentMt, homeSectionInner } from './homeLayout';
import { useTranslation } from '../../lib/i18n';
import PropertySearchBar from '../PropertySearchBar';
import HomeHeroVisuals from './HomeHeroVisuals';
import HeroStatCountUp from './HeroStatCountUp';

function BangladeshFlagIcon({ className = 'h-3.5 w-[1.125rem]' }) {
  return (
    <svg className={className} viewBox="0 0 20 12" aria-hidden>
      <rect width="20" height="12" rx="1.5" fill="#006A4E" />
      <circle cx="9" cy="6" r="3.2" fill="#F42A41" />
    </svg>
  );
}

function HeroCtaArrowIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 10h12m0 0l-4-4m4 4l-4 4" />
    </svg>
  );
}

function HeroSearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <path strokeLinecap="round" strokeWidth="2" d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function HeroStat({ display, end, prefix = '', suffix = '', separator = '', label, showDivider, animateKey, isVisible }) {
  return (
    <div
      className={`min-w-0 text-center sm:text-left ${showDivider ? 'sm:border-l sm:border-gray-200/90 sm:pl-6' : ''}`}
    >
      <p className="text-[1.75rem] font-bold tabular-nums tracking-tight text-[#2D6A4F] sm:text-[1.65rem]">
        <HeroStatCountUp
          display={display}
          end={end}
          prefix={prefix}
          suffix={suffix}
          separator={separator}
          animateKey={animateKey}
          active={isVisible}
        />
      </p>
      <p className="mt-1.5 text-sm font-medium leading-snug text-gray-500 sm:mt-1 sm:text-[0.8125rem]">{label}</p>
    </div>
  );
}

function HeroStats({ t }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);

  const stats = useMemo(
    () => [
      {
        display: t('home.statProperties'),
        end: 500,
        suffix: '+',
        label: t('home.statPropertiesLabel'),
      },
      {
        display: t('home.statUsers'),
        end: 1000,
        suffix: '+',
        separator: ',',
        label: t('home.statUsersLabel'),
      },
      {
        display: t('home.statRent'),
        end: 50,
        prefix: t('home.statRentCountPrefix'),
        suffix: t('home.statRentCountSuffix'),
        label: t('home.statRentLabel'),
      },
      {
        display: t('home.statSatisfaction'),
        end: 95,
        suffix: '%',
        label: t('home.statSatisfactionLabel'),
      },
    ],
    [t]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setAnimateKey((key) => key + 1);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="mx-auto mt-10 grid w-full max-w-[19rem] grid-cols-2 justify-items-center gap-x-6 gap-y-8 border-t border-gray-200/80 pt-8 sm:max-w-none sm:grid-cols-4 sm:justify-items-stretch sm:gap-0"
      role="group"
      aria-label={t('home.heroStatsGroup')}
    >
      {stats.map((stat, index) => (
        <HeroStat
          key={stat.label}
          {...stat}
          showDivider={index > 0}
          animateKey={animateKey}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}

export default function HomeHeroSection() {
  const { t } = useTranslation();
  const loggedIn = isLoggedIn();
  const role = getUserRole();

  const listPropertyTo =
    loggedIn && role === 'OWNER' ? '/owner-dashboard/create-listing' : '/owner-registration';

  return (
    <section className={`relative overflow-hidden bg-gradient-to-b from-[#f6fbf8] via-[#fafcfb] to-[#fafcfb] ${homeHeroPy}`}>
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(26 71 40 / 0.06) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-brand-50 blur-3xl" aria-hidden />

      <div className={`relative ${homeSectionInner}`}>
        <div className="grid items-center gap-8 sm:gap-12 max-lg:gap-y-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 xl:gap-16">
          {/* Left content — headline first on all breakpoints */}
          <div className="relative z-20" {...aosFadeUp(0)}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D6A4F]/25 bg-[#2D6A4F]/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#2D6A4F] sm:text-[10px]">
              <BangladeshFlagIcon className="h-2.5 w-[0.875rem] shrink-0" />
              {t('home.heroBadge')}
            </span>

            <h1 className="mt-5 max-w-[22rem] text-[2.125rem] font-bold leading-[1.1] tracking-tight text-gray-900 sm:max-w-xl sm:text-[2.625rem] lg:text-[2.875rem] lg:leading-[1.08]">
              {t('home.heroTitlePrefix')}{' '}
              <span className="text-[#2D6A4F]">{t('home.heroTitleHighlight')}</span>{' '}
              {t('home.heroTitleSuffix')}
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#4a6358] sm:text-[0.9375rem]">
              {t('home.heroSubtitle')}
            </p>

            <div className="relative z-20 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={listPropertyTo}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2D6A4F] px-6 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#255a43] sm:min-w-[11.5rem]"
              >
                {t('home.listPropertyFree')}
                <HeroCtaArrowIcon />
              </Link>
              <Link
                to="/listings"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#2D6A4F] bg-white px-6 text-sm font-semibold text-[#2D6A4F] no-underline transition-colors hover:bg-[#2D6A4F]/5 sm:min-w-[11.5rem]"
              >
                <HeroSearchIcon />
                {t('home.browseProperties')}
              </Link>
            </div>

            <HeroStats t={t} />
          </div>

          {/* Right visuals */}
          <div className="relative z-0 w-full min-w-0 lg:pl-2" {...aosFadeLeft(120)}>
            <HomeHeroVisuals t={t} />
          </div>
        </div>

        <div className={`relative z-10 mx-auto w-full max-w-4xl ${homeSectionContentMt}`} {...aosFadeUp(200)}>
          <PropertySearchBar variant="heroPanel" navigateOnSubmit />
        </div>
      </div>
    </section>
  );
}
