import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink, { BRAND_LOGO_IMG_CLASS_COMPACT } from '../components/BrandLogoLink';
import { isLoggedIn } from '../lib/api';
import { useTranslation } from '../lib/i18n';

const offeringIcons = [
  (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
  ),
];

function navLinkClass(emphasize) {
  if (emphasize) {
    return 'font-semibold text-teal-700 hover:text-teal-800 transition py-2.5 px-1 rounded-lg';
  }
  return 'text-gray-600 hover:text-teal-700 dark:hover:text-teal-400 transition py-2.5 px-1 rounded-lg';
}

export default function ServicesPage() {
  const { messages } = useTranslation();
  const services = messages.services;
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = isLoggedIn();
  const navigate = useNavigate();

  const headerNav = [
    { to: '/listings', label: services.nav.listings },
    { to: '/about', label: services.nav.about },
    { to: '/faq', label: services.nav.faq },
    { to: '/login', label: services.nav.login, authOnly: 'guest' },
    { to: '/signup', label: services.nav.signup, emphasize: true, authOnly: 'guest' },
  ];
  const visibleNav = headerNav.filter((item) => !(loggedIn && item.authOnly === 'guest'));

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
            <BrandLogoLink className="min-w-0 shrink-0" onClick={() => setMenuOpen(false)} />

            {loggedIn ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shrink-0"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {services.back}
              </button>
            ) : (
              <>
                <nav className="hidden lg:flex items-center justify-end gap-4 md:gap-6 text-sm shrink-0" aria-label="Main">
                  {visibleNav.map(({ to, label, emphasize }) => (
                    <Link key={to} to={to} className={navLinkClass(emphasize)}>
                      {label}
                    </Link>
                  ))}
                </nav>

                <button
                  type="button"
                  className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0"
                  aria-expanded={menuOpen}
                  aria-controls="services-mobile-nav"
                  aria-label={menuOpen ? services.nav.closeMenu : services.nav.openMenu}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  {menuOpen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {!loggedIn && menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px] motion-reduce:backdrop-blur-none animate-mobile-nav-backdrop motion-reduce:animate-none motion-reduce:opacity-100"
            aria-label={services.nav.closeMenu}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="services-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="services-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#eef4ef] px-5 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <BrandLogoLink
                  imgClassName={BRAND_LOGO_IMG_CLASS_COMPACT}
                  onClick={() => setMenuOpen(false)}
                />
                <span id="services-mobile-nav-title" className="sr-only">
                  {services.nav.mainMenu}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label={services.nav.closeMenu}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-1" aria-label="Main mobile">
              {visibleNav.map(({ to, label, emphasize }) => (
                <Link
                  key={to}
                  to={to}
                  className={
                    emphasize
                      ? 'mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition'
                      : 'rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition'
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-2">{services.eyebrow}</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{services.title}</h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mb-10 sm:mb-12">{services.intro}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12 sm:mb-14">
          {services.offerings.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-4">
                {offeringIcons[index]}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-teal-800 text-white px-4 py-8 sm:px-8 sm:py-10 text-center">
          <h2 className="text-lg sm:text-xl font-bold mb-2">{services.cta.title}</h2>
          <p className="text-teal-100 text-sm mb-6 max-w-lg mx-auto px-1">{services.cta.text}</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-teal-800 font-semibold text-sm hover:bg-teal-50 transition w-full sm:w-auto"
            >
              {services.cta.browseListings}
            </Link>
            {!loggedIn && (
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-teal-400 text-white font-semibold text-sm hover:bg-teal-700/50 transition w-full sm:w-auto"
              >
                {services.cta.createAccount}
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
