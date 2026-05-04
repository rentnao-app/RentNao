import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { apiFetch, getApiErrorMessage } from '../lib/api';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  toLocal11Digits,
} from '../lib/phone';

const PHONE_HINT =
  'Enter your 11-digit mobile starting with 01 (e.g. 01712345678). Third digit must be 3–9.';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const local11 = toLocal11Digits(clipPhoneInput(identifier));
    if (!isValidBdMobileLocal11(local11)) {
      setError(PHONE_HINT);
      setLoading(false);
      return;
    }
    const forApi = normalizeBdPhoneForApi(local11);
    if (!forApi) {
      setError(PHONE_HINT);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forApi,
          type: 'PHONE',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, 'Could not request password reset'));
      }
      setSuccess(body?.message || 'If an account exists, reset instructions were sent via SMS.');
    } catch (err) {
      setError(err.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Forgot Password</h1>
          <p className="text-gray-500 text-center mb-8">We will send a reset token to your mobile number (SMS).</p>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={identifier}
                  onChange={(e) => setIdentifier(clipPhoneInput(e.target.value))}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{PHONE_HINT}</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send reset token'}
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

