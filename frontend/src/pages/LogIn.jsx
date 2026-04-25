import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getApiErrorMessage, setAuthSession } from '../lib/api';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
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
      setEmail('');
      setPassword('');

      setTimeout(() => {
        if (user.role === 'OWNER') window.location.href = '/owner-dashboard';
        else if (user.role === 'TENANT') window.location.href = '/tenant-dashboard';
        else if (user.role === 'ADMIN') window.location.href = '/admin-dashboard';
        else window.location.href = '/';
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
            <p className="text-gray-500">Log in to access your dashboard</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
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
            Need to verify email or mobile?{' '}
            <Link to="/auth-verification" className="text-teal-700 hover:text-teal-800 font-semibold">
              Verify Now
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


