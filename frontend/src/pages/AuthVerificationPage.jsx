import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, getApiErrorMessage } from '../lib/api';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  toLocal11Digits,
} from '../lib/phone';

const PHONE_HINT =
  'Enter your 11-digit mobile starting with 01 (e.g. 01712345678). Third digit must be 3–9.';

export default function AuthVerificationPage() {
  const [searchParams] = useSearchParams();
  const defaultIdentifier = searchParams.get('identifier') || '';

  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const local11 = toLocal11Digits(clipPhoneInput(identifier));
      if (!isValidBdMobileLocal11(local11)) {
        throw new Error(PHONE_HINT);
      }
      const forApi = normalizeBdPhoneForApi(local11);
      if (!forApi) throw new Error(PHONE_HINT);

      const res = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forApi,
          type: 'PHONE',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, 'Could not resend verification'));
      }
      setSuccess(body?.message || 'Verification OTP sent');
    } catch (err) {
      setError(err.message || 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: phoneOtp.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, 'Verification failed'));
      }
      setSuccess(body?.message || 'Verification successful.');
      setPhoneOtp('');
    } catch (err) {
      setError(err.message || 'Verification failed');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Verify mobile</h1>
          <p className="text-gray-500 text-center mb-8">
            Enter the mobile you used at sign-up, resend the OTP if needed, then submit the 6-digit code.
          </p>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="space-y-5">
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
                />
                <p className="mt-1 text-xs text-gray-500">{PHONE_HINT}</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || !identifier.trim()}
                  className="mt-2 text-sm text-teal-700 hover:text-teal-800 font-semibold disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SMS OTP (6 digits)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
