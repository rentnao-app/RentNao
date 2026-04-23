import { Link } from 'react-router-dom';

export default function FeatureUnavailablePage({
  title = 'Feature Unavailable',
  description = 'This feature is not available yet in the current backend API.',
  backTo = '/',
  backLabel = 'Go Back',
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <Link to={backTo} className="text-sm font-medium text-teal-700 hover:text-teal-800">
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
          <p className="text-gray-600 mb-6">{description}</p>
          <p className="text-sm text-gray-500">
            This page is intentionally disabled to avoid broken behavior until matching backend endpoints are available.
          </p>
        </div>
      </main>
    </div>
  );
}
