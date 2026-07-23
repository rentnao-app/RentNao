import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink from './BrandLogoLink';
import { isLoggedIn } from '../lib/api';

export default function StaticPageHeader({ backLabel, nav = [] }) {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <header className="border-b border-gray-100 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogoLink />
        {loggedIn ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </button>
        ) : (
          <nav className="flex gap-4 sm:gap-6">
            {nav.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm text-gray-600 transition hover:text-teal-700">
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
