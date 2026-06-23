import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink, { BRAND_LOGO_IMG_CLASS_COMPACT } from '../components/BrandLogoLink';
import { isLoggedIn } from '../lib/api';

const highlights = [
  {
    title: 'What we do',
    description:
      'We connect property owners and tenants directly through a seamless online platform where everything can be managed in one place. Property owners can list easily, find verified tenants, and manage listings without spending on promotions. Tenants can explore verified properties with complete details including images, videos, 3D walkthroughs, and exact locations.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'A smarter rental experience',
    description:
      'Instant connection between tenants and owners, direct in-platform communication, real-time availability and transparency, and public ratings and reviews to maintain quality. We aim to minimize unnecessary hassle and make renting faster, simpler, and more reliable.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Fintech-enabled ecosystem',
    description:
      'Tenants can pay rent automatically through a secure wallet. Owners receive payments without delays or follow-ups. Users can easily cash in and cash out funds, with transactions recorded, transparent, and secure. This transforms renting into a smooth, trackable, and efficient financial experience.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    title: 'Verified users only',
    description:
      'Every user on Rent Nao goes through a verification process using real-time valid documents to ensure safety, trust, and transparency across the platform.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const whyRentNao = [
  'Verified users only',
  'No unnecessary middlemen',
  'Fast and simple process',
  'Transparent and secure system',
  'Built for both tenants and property owners',
];

const headerNav = [
  { to: '/listings', label: 'Listings' },
  { to: '/services', label: 'Services' },
  { to: '/faq', label: 'FAQ' },
  { to: '/login', label: 'Log In', authOnly: 'guest' },
  { to: '/signup', label: 'Sign Up', emphasize: true, authOnly: 'guest' },
];

function navLinkClass(emphasize) {
  if (emphasize) {
    return 'font-semibold text-teal-700 hover:text-teal-800 transition py-2.5 px-1 rounded-lg';
  }
  return 'text-gray-600 hover:text-teal-700 transition py-2.5 px-1 rounded-lg';
}

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = isLoggedIn();
  const navigate = useNavigate();
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
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
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
                  aria-controls="about-mobile-nav"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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
            className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px]"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="about-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#eef4ef] px-5 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <BrandLogoLink imgClassName={BRAND_LOGO_IMG_CLASS_COMPACT} onClick={() => setMenuOpen(false)} />
                <span id="about-mobile-nav-title" className="sr-only">
                  Main menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label="Close menu"
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
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-2">About Rent Nao</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
          Renting spaces in Bangladesh, made digital, trusted, and fast.
        </h1>
        <div className="text-base sm:text-lg text-gray-600 max-w-2xl mb-10 sm:mb-12 space-y-4 leading-relaxed">
          <p>
            Rent Nao is a digital platform built to transform the way people rent spaces in Bangladesh - whether it is a
            home, office, or commercial property.
          </p>
          <p>
            Finding a place to live or run a business has traditionally been time-consuming, uncertain, and inefficient.
            People often rely on physical searching, To-let signs, or brokers, while property owners struggle with
            unreliable tenants, vacancy losses, and lack of trust.
          </p>
          <p>
            Rent Nao solves these problems by creating a fast, trusted, and fully digital rental experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12 sm:mb-14">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-4">
                {item.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-12 sm:mb-14">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Our vision</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our vision is to become the default digital infrastructure for renting spaces across Bangladesh - from
              residential homes to commercial properties.
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              We are not just a rental service. We are building a complete rental ecosystem that combines technology,
              trust, and financial solutions to redefine how people access and manage space.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Our mission</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              To eliminate the struggle, uncertainty, and inefficiency of renting by making it fast, trusted, and
              completely digital.
            </p>
            <h3 className="mt-5 text-base font-bold text-gray-900 mb-2">Why Rent Nao?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {whyRentNao.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-teal-700 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="rounded-2xl bg-teal-800 text-white px-4 py-8 sm:px-8 sm:py-10 text-center">
          <h2 className="text-lg sm:text-xl font-bold mb-2">
            Rent Nao is where renting becomes simple, trusted, and digital.
          </h2>
          <p className="text-teal-100 text-sm mb-6 max-w-lg mx-auto px-1">
            Browse listings or create an account to get started as a tenant or property owner.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-teal-800 font-semibold text-sm hover:bg-teal-50 transition w-full sm:w-auto"
            >
              Browse listings
            </Link>
            {!loggedIn && (
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-teal-400 text-white font-semibold text-sm hover:bg-teal-700/50 transition w-full sm:w-auto"
              >
                Create account
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
