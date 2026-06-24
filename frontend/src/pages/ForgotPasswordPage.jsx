import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { apiFetch, getApiErrorMessage } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  toLocal11Digits,
} from '../lib/phone';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
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
      setError(t('common.phoneHint'));
      setLoading(false);
      return;
    }
    const forApi = normalizeBdPhoneForApi(local11);
    if (!forApi) {
      setError(t('common.phoneHint'));
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
        throw new Error(getApiErrorMessage(body, t('auth.forgotPassword.requestFailed')));
      }
      setSuccess(body?.message || t('auth.forgotPassword.successMessage'));
    } catch (err) {
      setError(err.message || t('auth.forgotPassword.requestError'));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">{t('auth.forgotPassword.title')}</h1>
          <p className="text-gray-500 text-center mb-8">{t('auth.forgotPassword.subtitle')}</p>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.mobileNumber')}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={identifier}
                  onChange={(e) => setIdentifier(clipPhoneInput(e.target.value))}
                  placeholder={t('common.phonePlaceholder')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{t('common.phoneHint')}</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? t('common.sending') : t('auth.forgotPassword.sendResetToken')}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.forgotPassword.hasToken')}{' '}
            <Link to="/reset-password" className="text-teal-700 font-semibold hover:text-teal-800">
              {t('auth.forgotPassword.resetPassword')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
