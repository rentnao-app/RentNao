import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { isLoggedIn } from '../lib/api';

export default function TermsPage() {
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
              Back
            </button>
          ) : (
            <nav className="flex gap-6">
              <Link to="/about" className="text-sm text-gray-600 hover:text-teal-700">About</Link>
              <Link to="/faq" className="text-sm text-gray-600 hover:text-teal-700">FAQ</Link>
            </nav>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
          <p>Last updated: 2026.</p>
          <p>By using RentNao you agree to these terms. RentNao provides a platform for listing and discovering rental properties. We do not guarantee the accuracy of listings or the conduct of users. Users are responsible for their own due diligence and transactions.</p>
          <p>Listing access fees and other payments are subject to our payment policy. Refunds are at our discretion. We reserve the right to suspend or terminate accounts that violate our policies or the law.</p>
          <p>For questions, contact us through the Contact page.</p>
        </div>
      </main>
    </div>
  );
}


