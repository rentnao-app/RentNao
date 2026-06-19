import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchProfileStatus,
  getApiUrl,
  getUserId,
  getUserRole,
  resolveOnboardingRoute,
  setAuthSession,
} from '../lib/api';
import { useTranslation } from '../lib/i18n';

export default function GoogleAuthCallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const apiUrl = getApiUrl();

  const callbackData = useMemo(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const code = searchParams.get('code');
    return { error, message, code };
  }, [searchParams]);

  useEffect(() => {
    if (callbackData.error) return;

    if (callbackData.code) {
      const exchangeCode = async () => {
        try {
          const res = await fetch(`${apiUrl}/auth/google/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: callbackData.code }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || t('auth.googleCallback.exchangeFailed'));

          setAuthSession({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
          });

          const user = data?.user || null;
          const userId = getUserId(user);
          const localRole = getUserRole(user);

          if (!userId) {
            throw new Error(t('auth.googleCallback.userIncomplete'));
          }

          const { res: statusRes, profileStatus, role, body: statusBody } = await fetchProfileStatus(userId);
          if (!statusRes.ok) {
            throw new Error(t('auth.googleCallback.profileStatusFailed'));
          }

          window.location.href = resolveOnboardingRoute(profileStatus, role || localRole, statusBody?.data?.kycVerificationStatus || null);
        } catch (err) {
          const message = err instanceof Error ? err.message : t('auth.googleCallback.exchangeFailed');
          console.error('Code exchange failed:', err);
          window.location.search = `?error=exchange_failed&message=${encodeURIComponent(message)}`;
        }
      };

      exchangeCode();
    }
  }, [apiUrl, callbackData.code, callbackData.error, t]);

  const hasPayload = Boolean(callbackData.code);
  const isError = Boolean(callbackData.error);
  const status = callbackData.error
    ? callbackData.message || callbackData.error || t('auth.googleCallback.loginFailed')
    : hasPayload
      ? t('auth.googleCallback.authenticating')
      : t('auth.googleCallback.missingPayload');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-3">{t('auth.googleCallback.title')}</h1>
        <p className={`text-sm ${isError ? 'text-red-600' : 'text-gray-600'}`}>{status}</p>
        {isError && (
          <div className="mt-5">
            <Link to="/login" className="text-teal-700 font-semibold hover:text-teal-800 text-sm">
              {t('common.backToLogin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
