import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { apiFetch, getApiErrorMessage, setAuthSession } from '../lib/api';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { addLocalNotification } from '../lib/notifications';
import { savePublicProfileSnapshot } from '../lib/publicProfiles';
import { useTranslation } from '../lib/i18n';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  rememberSignupPhoneLocal11,
  toLocal11Digits,
} from '../lib/phone';

export default function SignUp() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
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

    const local11 = toLocal11Digits(clipPhoneInput(phone));
    if (!isValidBdMobileLocal11(local11)) {
      setError(t('common.phoneHintSignup'));
      setLoading(false);
      return;
    }

    const forApi = normalizeBdPhoneForApi(local11);
    if (!forApi) {
      setError(t('common.phoneHintSignup'));
      setLoading(false);
      return;
    }

    try {
      const registerResponse = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forApi,
          identifierType: 'PHONE',
          role,
          password,
          confirmPassword: password,
        }),
      });

      const body = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        throw new Error(getApiErrorMessage(body, t('auth.signup.registrationFailed')));
      }

      setAuthSession({
        accessToken: body?.data?.tokens?.accessToken,
        refreshToken: body?.data?.tokens?.refreshToken,
        user: body?.data?.user,
      });

      const createdUser = body?.data?.user || {};
      const createdUserId = createdUser?.userId || createdUser?.user_id || createdUser?.id || '';
      if (createdUserId) {
        savePublicProfileSnapshot({
          userId: createdUserId,
          name: createdUser?.username || t('common.user'),
          email: createdUser?.contactEmail || createdUser?.contact_email || '',
          phone: local11,
          role: role || createdUser?.role || '',
          verificationStatus: 'PENDING',
        });
      }
      addLocalNotification({
        title: t('auth.signup.accountCreatedTitle'),
        message: t('auth.signup.accountCreatedMessage'),
        url: '/auth-verification?type=PHONE',
        type: 'AUTH',
      });
      setSuccess(t('auth.signup.successRedirect'));
      rememberSignupPhoneLocal11(local11);
      setPhone('');
      setPassword('');

      setTimeout(() => {
        window.location.href = '/auth-verification?type=PHONE';
      }, 1500);
    } catch (err) {
      setError(err.message || t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          <nav className="flex items-center gap-4">
            <Link to="/listings" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
              {t('common.browse')}
            </Link>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
              {t('common.logIn')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.signup.title')}</h1>
            <p className="text-gray-500">{t('auth.signup.subtitle')}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.mobileNumber')}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(clipPhoneInput(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder={t('common.phonePlaceholder')}
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">{t('common.phoneHintSignup')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder={t('auth.signup.passwordPlaceholder')}
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('auth.signup.selectRole')}</label>
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
                    <div className="font-semibold">{t('auth.signup.tenant')}</div>
                    <div className="mt-0.5 text-xs font-normal text-gray-500">{t('auth.signup.rentProperty')}</div>
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
                    <div className="font-semibold">{t('auth.signup.owner')}</div>
                    <div className="mt-0.5 text-xs font-normal text-gray-500">{t('auth.signup.listYourProperty')}</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.signup.signingUp') : t('common.signUp')}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">{t('common.or')}</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <GoogleAuthButton mode="signup" role={role} />
            </form>
          </div>

          <p className="mt-6 text-center text-gray-500 text-sm">
            {t('auth.signup.hasAccount')}{' '}
            <Link to="/login" className="text-teal-700 hover:text-teal-800 font-semibold">
              {t('common.logIn')}
            </Link>
          </p>
          <p className="mt-3 text-center text-xs font-medium tracking-wide text-gray-500 uppercase">
            {t('common.verifiedUsersOnly')}
          </p>
        </div>
      </main>
    </div>
  );
}
