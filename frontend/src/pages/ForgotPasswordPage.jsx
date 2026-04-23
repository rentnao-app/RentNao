import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getApiErrorMessage } from '../lib/api';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [type, setType] = useState('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          type,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, 'Could not request password reset'));
      }
      setSuccess(body?.message || 'Reset instructions sent. Check your email/SMS for token.');
    } catch (err) {
      setError(err.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Forgot Password</h1>
          <p className="text-gray-500 text-center mb-8">We will send a reset token to your email or phone.</p>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Recovery Channel</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Mobile Number</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {type === 'EMAIL' ? 'Email Address' : 'Mobile Number'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={type === 'EMAIL' ? 'user@example.com' : '01XXXXXXXXX'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Token'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have reset token?{' '}
            <Link to="/reset-password" className="text-teal-700 font-semibold hover:text-teal-800">
              Reset Password
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
