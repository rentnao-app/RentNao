import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  apiFetch,
  fetchProfileStatus,
  getApiErrorMessage,
  getUserId,
  getUserRole,
  resolveOnboardingRoute,
  setAuthSession,
} from '../lib/api';
import GoogleAuthButton from '../components/GoogleAuthButton';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  toLocal11Digits,
} from '../lib/phone';

const PHONE_HINT =
  'Use your 11-digit mobile starting with 01 (e.g. 01712345678). Third digit must be 3–9.';

export default function LogIn() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogIn = async (e) => {
    e.preventDefault();
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
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forApi,
          password,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(getApiErrorMessage(body, 'Login failed'));
        return;
      }

      const user = body?.data?.user;
      setAuthSession({
        accessToken: body?.data?.tokens?.accessToken,
        refreshToken: body?.data?.tokens?.refreshToken,
        user,
      });

      if (!user) {
        setError('Login succeeded but user payload is missing.');
        return;
      }

      setSuccess('Login successful! Redirecting...');
      setPhone('');
      setPassword('');

      const userId = getUserId(user);
      const localRole = getUserRole(user);
      if (!userId) {
        setError('Login succeeded but user identifier is missing.');
        return;
      }

      const { res: statusRes, profileStatus, role } = await fetchProfileStatus(userId);
      if (!statusRes.ok) {
        setError('Login succeeded but profile status could not be loaded.');
        return;
      }

      const target = resolveOnboardingRoute(profileStatus, role || localRole);
      setTimeout(() => {
        window.location.href = target;
      }, 1000);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/listings" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
              Browse
            </Link>
            <Link to="/signup" className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Log in with your mobile number or Google</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {success}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleLogIn} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(clipPhoneInput(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="01XXXXXXXXX"
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">{PHONE_HINT}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="Enter your password"
                  required
                />
                <div className="mt-2 text-right">
                  <Link to="/forgot-password" className="text-xs font-medium text-teal-700 hover:text-teal-800">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <GoogleAuthButton mode="login" />
            </form>
          </div>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-teal-700 hover:text-teal-800 font-semibold">
              Sign Up
            </Link>
          </p>
          <p className="mt-2 text-center text-gray-500 text-sm">
            Need to verify your mobile?{' '}
            <Link to="/auth-verification?type=PHONE" className="text-teal-700 hover:text-teal-800 font-semibold">
              Verify now
            </Link>
          </p>
          <p className="mt-3 text-center text-xs font-medium tracking-wide text-gray-500 uppercase">
            For verified users only
          </p>
        </div>
      </main>
    </div>
  );
}
