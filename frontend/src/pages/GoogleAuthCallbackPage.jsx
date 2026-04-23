import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { setAuthSession } from '../lib/api';

function getDashboardPath(role) {
  if (role === 'ADMIN') return '/admin-dashboard';
  if (role === 'OWNER') return '/owner-dashboard';
  return '/tenant-dashboard';
}

function parseUser(userParam) {
  if (!userParam) return null;
  try {
    return JSON.parse(userParam);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(userParam));
    } catch {
      return null;
    }
  }
}

export default function GoogleAuthCallbackPage() {
  const [searchParams] = useSearchParams();

  const callbackData = useMemo(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const user = parseUser(searchParams.get('user'));
    return { error, message, accessToken, refreshToken, user };
  }, [searchParams]);

  useEffect(() => {
    if (callbackData.error || !callbackData.accessToken || !callbackData.user) {
      return;
    }

    setAuthSession({
      accessToken: callbackData.accessToken,
      refreshToken: callbackData.refreshToken,
      user: callbackData.user,
    });

    const role = callbackData.user?.role || callbackData.user?.userRole;
    const target = getDashboardPath(role);
    const timeout = setTimeout(() => {
      window.location.href = target;
    }, 800);

    return () => clearTimeout(timeout);
  }, [callbackData]);

  const hasPayload = Boolean(callbackData.accessToken && callbackData.user);
  const isError = Boolean(callbackData.error || !hasPayload);
  const status = callbackData.error
    ? callbackData.message || callbackData.error || 'Google login failed'
    : hasPayload
      ? 'Login successful! Redirecting...'
      : 'Missing authentication payload from Google callback.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Google Authentication</h1>
        <p className={`text-sm ${isError ? 'text-red-600' : 'text-gray-600'}`}>{status}</p>
        {isError && (
          <div className="mt-5">
            <Link to="/login" className="text-teal-700 font-semibold hover:text-teal-800 text-sm">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
