import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-black text-gray-200 mb-2">404</h1>
        <p className="text-xl font-semibold text-gray-700 mb-4">Page not found</p>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition">
          Back to Home
        </Link>
      </div>
    </div>
  );
}


