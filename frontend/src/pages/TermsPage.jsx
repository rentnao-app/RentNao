import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { isLoggedIn } from '../lib/api';
import { useTranslation } from '../lib/i18n';

export default function TermsPage() {
  const { messages } = useTranslation();
  const terms = messages.terms;
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          {loggedIn ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
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
              {terms.back}
            </button>
          ) : (
            <nav className="flex gap-6">
              <Link to="/about" className="text-sm text-gray-600 hover:text-teal-700">{terms.nav.about}</Link>
              <Link to="/faq" className="text-sm text-gray-600 hover:text-teal-700">{terms.nav.faq}</Link>
            </nav>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{terms.title}</h1>
        <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
          {terms.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </main>
    </div>
  );
}
