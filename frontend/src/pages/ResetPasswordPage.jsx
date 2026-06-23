import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { apiFetch, getApiErrorMessage } from '../lib/api';
import { useTranslation } from '../lib/i18n';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenChecked, setTokenChecked] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const verifyToken = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, t('auth.resetPassword.tokenInvalid')));
      }
      setTokenChecked(true);
      setTokenValid(true);
      setSuccess(body?.message || t('auth.resetPassword.tokenValid'));
    } catch (err) {
      setTokenChecked(true);
      setTokenValid(false);
      setError(err.message || t('auth.resetPassword.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!tokenValid) {
      setError(t('auth.resetPassword.verifyFirst'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth.resetPassword.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, t('auth.resetPassword.resetFailed')));
      }
      setSuccess(body?.message || t('auth.resetPassword.resetSuccess'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || t('auth.resetPassword.couldNotReset'));
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
            {t('common.backToLogin')}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">{t('auth.resetPassword.title')}</h1>
          <p className="text-gray-500 text-center mb-8">{t('auth.resetPassword.subtitle')}</p>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={resetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.resetPassword.resetToken')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setTokenChecked(false);
                      setTokenValid(false);
                    }}
                    placeholder={t('auth.resetPassword.tokenPlaceholder')}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={verifyToken}
                    disabled={loading || !token.trim()}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg disabled:opacity-50"
                  >
                    {t('auth.resetPassword.verify')}
                  </button>
                </div>
                {tokenChecked && (
                  <p className={`mt-2 text-xs ${tokenValid ? 'text-green-600' : 'text-red-600'}`}>
                    {tokenValid ? t('auth.resetPassword.tokenVerified') : t('auth.resetPassword.verifyFailed')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.resetPassword.newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.resetPassword.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? t('auth.resetPassword.resetting') : t('auth.forgotPassword.resetPassword')}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.resetPassword.needNewToken')}{' '}
            <Link to="/forgot-password" className="text-teal-700 font-semibold hover:text-teal-800">
              {t('auth.resetPassword.requestAgain')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
