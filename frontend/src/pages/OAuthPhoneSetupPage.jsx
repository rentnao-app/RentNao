import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  rememberSignupPhoneLocal11,
  toLocal11Digits,
} from '../lib/phone';

const PHONE_HINT =
  'Enter your 11-digit mobile starting with 01 (e.g. 01712345678). Third digit must be 3–9.';

export default function OAuthPhoneSetupPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verifyCurrentStep = async () => {
      const currentUser = getCurrentUser();
      const userId = getUserId(currentUser);
      const localRole = getUserRole(currentUser);
      if (!userId) {
        window.location.href = '/login';
        return;
      }

      try {
        const { res, profileStatus, role } = await fetchProfileStatus(userId);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            window.location.href = '/login';
          }
          return;
        }
        if (profileStatus !== 'PHONE_REQUIRED') {
          window.location.href = resolveOnboardingRoute(profileStatus, role || localRole);
        }
      } catch {
        // Ignore bootstrap errors to keep the form available.
      }
    };

    verifyCurrentStep();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const local11 = toLocal11Digits(clipPhoneInput(phone));
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
      const res = await apiFetch('/auth/phone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forApi }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, 'Could not start phone verification'));
      }

      rememberSignupPhoneLocal11(local11);
      setSuccess(body?.message || 'OTP sent to your phone.');
      setPhone('');
      window.location.href = '/auth-verification?type=PHONE';
    } catch (err) {
      setError(err.message || 'Could not start phone verification');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Set up your phone</h1>
          <p className="text-gray-500 text-center mb-8">
            Add your mobile number to continue onboarding. We will send an OTP for verification.
          </p>

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
                  value={phone}
                  onChange={(e) => setPhone(clipPhoneInput(e.target.value))}
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
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
