import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">RentNao</Link>
          <nav className="flex gap-6">
            <Link to="/about" className="text-sm text-gray-600 hover:text-teal-700">About</Link>
            <Link to="/faq" className="text-sm text-gray-600 hover:text-teal-700">FAQ</Link>
          </nav>
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

