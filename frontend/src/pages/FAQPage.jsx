import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { isLoggedIn } from '../lib/api';
import { useTranslation } from '../lib/i18n';

export default function FAQPage() {
  const { messages } = useTranslation();
  const faq = messages.faq;
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
              {faq.back}
            </button>
          ) : (
            <nav className="flex gap-6">
              <Link to="/about" className="text-sm text-gray-600 hover:text-teal-700">{faq.nav.about}</Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-teal-700">{faq.nav.terms}</Link>
            </nav>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{faq.title}</h1>
        <div className="space-y-6">
          {faq.items.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{item.q}</h2>
              {item.intro ? <p className="text-gray-600 text-sm">{item.intro}</p> : null}
              {Array.isArray(item.bullets) && item.bullets.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-600 text-sm">
                  {item.bullets.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {item.outro ? <p className="mt-2 text-gray-600 text-sm">{item.outro}</p> : null}
              {Array.isArray(item.extraBullets) && item.extraBullets.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-600 text-sm">
                  {item.extraBullets.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {item.note ? <p className="mt-2 text-gray-600 text-sm">{item.note}</p> : null}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
