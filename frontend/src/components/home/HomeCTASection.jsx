import { Link } from 'react-router-dom';
import { getCurrentUser, getUserRole, isLoggedIn } from '../../lib/api';
import { aosFadeUp } from '../../lib/aos';
import { homeSectionInner, homeSectionPy } from './homeLayout';
import { useTranslation } from '../../lib/i18n';

export default function HomeCTASection() {
  const { t } = useTranslation();
  const loggedIn = isLoggedIn();
  const role = getUserRole(getCurrentUser());

  const listPropertyTo =
    loggedIn && role === 'OWNER' ? '/owner-dashboard/create-listing' : '/owner-registration';

  return (
    <section className={`bg-white ${homeSectionPy}`} aria-labelledby="home-cta-heading">
      <div className={homeSectionInner}>
        <div className="relative mx-auto w-full overflow-hidden rounded-[20px]" {...aosFadeUp(80)}>
          <div className="absolute inset-0 bg-[#1e5236]" aria-hidden />
          <img
            src="/hero-premium-2.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[68%_42%] opacity-[0.16] mix-blend-overlay"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#2b6344]/95 via-[#245338]/92 to-[#163724]/96"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(12,36,24,0.42)_100%)]"
            aria-hidden
          />

          <div className="relative z-10 flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-14 md:px-14 md:py-16 lg:px-16 lg:py-[4.25rem]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8e6d4] sm:text-[11px]">
              {t('home.ctaEyebrow')}
            </p>

            <h2
              id="home-cta-heading"
              className="mt-3 text-[1.75rem] font-bold leading-[1.2] tracking-tight text-white sm:mt-3.5 sm:text-[2.125rem] md:text-[2.375rem]"
            >
              {t('home.ctaTitle')}
            </h2>

            <p className="mt-3 max-w-[38rem] text-[0.8125rem] leading-[1.65] text-white/85 sm:mt-4 sm:text-sm md:text-[0.9375rem]">
              {t('home.ctaDescription')}
            </p>

            <div className="mt-7 flex w-full max-w-[22rem] flex-col items-stretch gap-3 sm:mt-8 sm:max-w-none sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Link
                to={listPropertyTo}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#1a4728] no-underline transition hover:bg-[#f5fbf7] sm:min-w-[11.5rem] sm:px-8"
              >
                {t('home.listPropertyFree')}
              </Link>
              <Link
                to="/listings"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/80 bg-transparent px-7 text-sm font-semibold text-white no-underline transition hover:bg-white/10 sm:min-w-[11.5rem] sm:px-8"
              >
                {t('home.browseProperties')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
