import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useTranslation } from '../lib/i18n';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  rememberSignupPhoneLocal11,
  toLocal11Digits,
} from '../lib/phone';

export default function OAuthPhoneSetupPage() {
  const { t } = useTranslation();
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
        const { res, profileStatus, role, body: statusBody } = await fetchProfileStatus(userId);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            window.location.href = '/login';
          }
          return;
        }
        if (profileStatus !== 'PHONE_REQUIRED') {
          window.location.href = resolveOnboardingRoute(profileStatus, role || localRole, statusBody?.data?.kycVerificationStatus || null);
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
      const res = await apiFetch('/auth/phone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forApi }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, t('auth.oauthPhone.startFailed')));
      }

      rememberSignupPhoneLocal11(local11);
      setSuccess(body?.message || t('auth.oauthPhone.otpSent'));
      setPhone('');
      window.location.href = '/auth-verification?type=PHONE';
    } catch (err) {
      setError(err.message || t('auth.oauthPhone.startFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
            {t('common.backToLogin')}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">{t('auth.oauthPhone.title')}</h1>
          <p className="text-gray-500 text-center mb-8">{t('auth.oauthPhone.subtitle')}</p>

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
                  value={phone}
                  onChange={(e) => setPhone(clipPhoneInput(e.target.value))}
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
                {loading ? t('auth.oauthPhone.sendingOtp') : t('auth.oauthPhone.sendOtp')}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
