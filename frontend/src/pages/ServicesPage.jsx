import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isLoggedIn } from '../lib/api';

const offerings = [
  {
    title: 'For tenants',
    description:
      'Browse verified listings, save favourites, send rental requests to owners, and get notified when something changes. Unlock full address and contact details when you are ready.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'For owners',
    description:
      'List properties, upload photos, edit details any time, and review rental requests from tenants. Use your wallet for listing fees and keep everything in one place.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Trust & support',
    description:
      'Identity verification for a safer community, in-app notifications, and help through our FAQ. We are focused on clear pricing in BDT and a smooth rental journey.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const headerNav = [
  { to: '/listings', label: 'Listings' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/login', label: 'Log In' },
  { to: '/signup', label: 'Sign Up', emphasize: true },
];

function navLinkClass(emphasize) {
  if (emphasize) {
    return 'font-semibold text-teal-700 hover:text-teal-800 transition py-2.5 px-1 rounded-lg';
  }
  return 'text-gray-600 hover:text-teal-700 dark:hover:text-teal-400 transition py-2.5 px-1 rounded-lg';
}

export default function ServicesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = isLoggedIn();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
            <Link
              to="/"
              className="text-xl sm:text-2xl font-bold text-teal-800 tracking-tight leading-none shrink-0 min-w-0"
              onClick={() => setMenuOpen(false)}
            >
              Rent Nao
            </Link>

            <nav className="hidden sm:flex items-center justify-end gap-4 md:gap-6 text-sm shrink-0" aria-label="Main">
              {headerNav.map(({ to, label, emphasize }) => (
                <Link key={to} to={to} className={navLinkClass(emphasize)}>
                  {label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 shrink-0"
              aria-expanded={menuOpen}
              aria-controls="services-mobile-nav"
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
          </div>

          {menuOpen && (
            <div
              id="services-mobile-nav"
              className="sm:hidden border-t border-gray-100"
            >
              <nav className="flex flex-col py-2 pb-4 text-sm" aria-label="Main mobile">
                {headerNav.map(({ to, label, emphasize }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`${navLinkClass(emphasize)} px-1`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-2">What we offer</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">Services</h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mb-10 sm:mb-12">
          Rent Nao helps you rent and let property with less friction—from discovery and requests to photos, listings, and
          wallet-based fees.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-14">
          {offerings.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-4">
                {item.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-teal-800 text-white px-4 py-8 sm:px-8 sm:py-10 text-center">
          <h2 className="text-lg sm:text-xl font-bold mb-2">Ready to start?</h2>
          <p className="text-teal-100 text-sm mb-6 max-w-lg mx-auto px-1">
            Create an account as a tenant or owner, complete verification, and use the dashboard to manage your activity.
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

