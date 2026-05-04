import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import {
  apiFetch,
  fetchProfileStatus,
  getApiErrorMessage,
  getCurrentUser,
  getUserId,
  getUserRole,
  resolveOnboardingRoute,
} from '../lib/api';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  toLocal11Digits,
  consumeSignupPhoneLocal11,
} from '../lib/phone';

export default function AuthVerificationPage() {
  const [searchParams] = useSearchParams();
  
  const [identifier, setIdentifier] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load stored phone on mount
  useEffect(() => {
    const fromQuery = searchParams.get('identifier') || '';
    const fromSession = fromQuery ? '' : consumeSignupPhoneLocal11();
    const user = getCurrentUser();
    const fromUser = user?.contactPhone || user?.contact_phone || '';
    const raw = fromQuery || fromSession || fromUser;
    const local11 = toLocal11Digits(clipPhoneInput(raw));
    if (local11 && isValidBdMobileLocal11(local11)) {
      setIdentifier(local11);
    }
  }, [searchParams]);

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!identifier) {
        throw new Error('Phone number not available. Please log in again.');
      }
      const forApi = normalizeBdPhoneForApi(identifier);
      if (!forApi) throw new Error('Invalid phone number');

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

      const currentUser = getCurrentUser();
      const userId = getUserId(currentUser);
      const localRole = getUserRole(currentUser);
      if (!userId) {
        window.location.href = '/login';
        return;
      }

      const { res: statusRes, profileStatus, role, body: statusBody } = await fetchProfileStatus(userId);
      if (!statusRes.ok) {
        throw new Error('Verification succeeded but profile status could not be loaded');
      }

      window.location.href = resolveOnboardingRoute(profileStatus, role || localRole, statusBody?.data?.kycVerificationStatus || null);
    } catch (err) {
      setError(err.message || 'Verification failed');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Verify mobile</h1>
          <p className="text-gray-500 text-center mb-8">
            Enter the 6-digit OTP sent to your mobile number.
          </p>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleVerify} className="space-y-5">
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

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || !identifier}
                className="w-full text-sm text-teal-700 hover:text-teal-800 font-semibold py-2 disabled:opacity-50"
              >
                Didn't get the code? Resend
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

