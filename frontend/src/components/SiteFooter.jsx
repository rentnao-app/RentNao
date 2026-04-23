import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="bg-teal-900 text-teal-200 py-6">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs sm:text-sm">&copy; 2026 RentNao. All rights reserved.</p>
        <div className="flex flex-wrap gap-5 text-xs sm:text-sm">
          <Link to="/about" className="hover:text-white transition">
            About
          </Link>
          <Link to="/terms" className="hover:text-white transition">
            Terms
          </Link>
          <Link to="/faq" className="hover:text-white transition">
            FAQ
          </Link>
          <Link to="/listings" className="hover:text-white transition">
            Listings
          </Link>
        </div>
      </div>
    </footer>
  );
}
