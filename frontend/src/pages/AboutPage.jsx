import { Link } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          <nav className="flex gap-6">
            <Link to="/listings" className="text-sm text-gray-600 hover:text-teal-700">Listings</Link>
            <Link to="/login" className="text-sm text-gray-600 hover:text-teal-700">Log In</Link>
            <Link to="/signup" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Sign Up</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About RentNao</h1>
        <p className="text-gray-600 mb-4">
          RentNao is a rental marketplace that connects property owners with tenants. We help owners list their properties easily and help tenants find their perfect home without the hassle.
        </p>
        <p className="text-gray-600 mb-4">
          Our mission is to make renting transparent, secure, and simple. Every owner is verified, and tenants can view detailed listing information after a small one-time fee. Both parties can rate each other after a rental, building trust for the community.
        </p>
        <p className="text-gray-600 mb-8">
          Whether you are looking to rent out your property or find a new place to call home, RentNao is here to help.
        </p>
        <Link to="/listings" className="inline-block px-6 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition">Browse Listings</Link>
      </main>
    </div>
  );
}


