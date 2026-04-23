import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getApiErrorMessage, setAuthSession } from '../lib/api';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { addLocalNotification } from '../lib/notifications';
import { savePublicProfileSnapshot } from '../lib/publicProfiles';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TENANT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const registerResponse = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          identifierType: 'EMAIL',
          role,
          password,
          confirmPassword: password,
        }),
      });

      const body = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        throw new Error(getApiErrorMessage(body, 'Registration failed'));
      }

      setAuthSession({
        accessToken: body?.data?.tokens?.accessToken,
        refreshToken: body?.data?.tokens?.refreshToken,
        user: body?.data?.user,
      });

      const needsVerification = Boolean(body?.data?.needsVerification);
      const createdUser = body?.data?.user || {};
      const createdUserId = createdUser?.userId || createdUser?.user_id || createdUser?.id || '';
      if (createdUserId) {
        savePublicProfileSnapshot({
          userId: createdUserId,
          name: createdUser?.username || 'User',
          email,
          role: role || createdUser?.role || '',
          verificationStatus: needsVerification ? 'PENDING' : 'APPROVED',
        });
      }
      addLocalNotification({
        title: 'Account Created',
        message: needsVerification
          ? 'Welcome! Please verify your email/phone to continue.'
          : 'Welcome to RentNao. Your account is ready.',
        url: needsVerification ? '/auth-verification' : '/account',
        type: 'AUTH',
      });
      setSuccess(
        needsVerification
          ? 'Sign up successful! Please verify your contact information.'
          : 'Sign up successful! Redirecting...'
      );
      setEmail('');
      setPassword('');

      setTimeout(() => {
        if (needsVerification) {
          window.location.href = `/auth-verification?identifier=${encodeURIComponent(email)}&type=EMAIL`;
          return;
        }
        window.location.href = role === 'TENANT' ? '/tenant-registration' : '/owner-registration';
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 pr-14 sm:pr-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/listings" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
              Browse
            </Link>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
              Log In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an Account</h1>
            <p className="text-gray-500">Join RentNao to find or list properties</p>
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
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="Min. 6 characters"
                  required
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">I want to</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('TENANT')}
                    className={`py-4 px-4 rounded-lg border-2 text-center transition font-medium text-sm ${
                      role === 'TENANT'
                        ? 'border-teal-700 bg-teal-50 text-teal-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    Find a Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('OWNER')}
                    className={`py-4 px-4 rounded-lg border-2 text-center transition font-medium text-sm ${
                      role === 'OWNER'
                        ? 'border-teal-700 bg-teal-50 text-teal-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
                      </svg>
                    </div>
                    List Property
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <GoogleAuthButton mode="signup" />
            </form>
          </div>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-700 hover:text-teal-800 font-semibold">
              Log In
            </Link>
          </p>
          <p className="mt-2 text-center text-gray-500 text-sm">
            Already signed up but unverified?{' '}
            <Link to="/auth-verification" className="text-teal-700 hover:text-teal-800 font-semibold">
              Verify Contact
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

