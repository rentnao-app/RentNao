import { useEffect, useMemo, useState } from 'react';
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
import BrandLogoLink from '../components/BrandLogoLink';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useHomeAos } from '../hooks/useHomeAos';
import { aosFadeIn, aosFadeRight, aosFadeUp, aosStagger } from '../lib/aos';
import { useTranslation } from '../lib/i18n';
import {
  clipPhoneInput,
  isValidBdMobileLocal11,
  normalizeBdPhoneForApi,
  toLocal11Digits,
} from '../lib/phone';

const REMEMBER_KEY = 'rentnao_login_remember_phone';

function FeatureItem({ icon, label, aosDelay = 0 }) {
  return (
    <div className="flex items-center gap-3" {...aosFadeUp(aosDelay, 550)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2A7D4F]/45 text-[#D8F3DC] ring-1 ring-[#52B788]/35" aria-hidden>
        {icon}
      </span>
      <span className="text-sm font-medium leading-snug text-white/95">{label}</span>
    </div>
  );
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3l18 18M10.5 10.6a2.5 2.5 0 003.5 3.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9.9 5.2A10.5 10.5 0 0112 5c5 0 9.3 3.1 11 7.5a12.4 12.4 0 01-4.2 5.1M6.1 6.1A12.3 12.3 0 001 12.5C2.7 16.9 7 20 12 20c1.7 0 3.3-.3 4.7-.9"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M2 12.5C3.7 8.1 8 5 13 5s9.3 3.1 11 7.5c-1.7 4.4-6 7.5-11 7.5S3.7 16.9 2 12.5z"
      />
      <circle cx="13" cy="12.5" r="2.75" strokeWidth={1.75} />
    </svg>
  );
}

export default function LogIn() {
  const { t } = useTranslation();
  useHomeAos();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setPhone(saved);
        setRememberMe(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const features = useMemo(
    () => [
      {
        id: 'verified',
        label: t('auth.login.featureVerified'),
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v5.5c0 4.6-2.9 8.8-7 10.5-4.1-1.7-7-5.9-7-10.5V6l7-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 12.5l1.8 1.8 3.5-3.6" />
          </svg>
        ),
      },
      {
        id: 'encrypted',
        label: t('auth.login.featureEncrypted'),
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V8a4 4 0 118 0v3M7 11h10v9H7v-9z" />
          </svg>
        ),
      },
      {
        id: 'payments',
        label: t('auth.login.featurePayments'),
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16v10H4V8zm0 3h16M8 15h3" />
          </svg>
        ),
      },
      {
        id: 'approval',
        label: t('auth.login.featureApproval'),
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 3L5 14h6l-1 7 9-12h-6l1-6z" />
          </svg>
        ),
      },
    ],
    [t]
  );

  const handleLogIn = async (e) => {
    e.preventDefault();
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
        setError(getApiErrorMessage(body, t('auth.login.loginFailed')));
        return;
      }

      const user = body?.data?.user;
      setAuthSession({
        accessToken: body?.data?.tokens?.accessToken,
        refreshToken: body?.data?.tokens?.refreshToken,
        user,
      });

      if (!user) {
        setError(t('auth.login.userPayloadMissing'));
        return;
      }

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, local11);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        // ignore storage errors
      }

      setPhone('');
      setPassword('');

      const userId = getUserId(user);
      const localRole = getUserRole(user);
      if (!userId) {
        setError(t('auth.login.userIdMissing'));
        return;
      }

      const { res: statusRes, profileStatus, role, body: statusBody } = await fetchProfileStatus(userId);
      if (!statusRes.ok) {
        setError(t('auth.login.profileStatusFailed'));
        return;
      }

      if (profileStatus === 'PHONE_VERIFICATION_PENDING') {
        setSuccess(t('auth.login.verificationRedirect'));
      } else {
        setSuccess(t('auth.login.successRedirect'));
      }

      const target = resolveOnboardingRoute(
        profileStatus,
        role || localRole,
        statusBody?.data?.kycVerificationStatus || null
      );
      setTimeout(() => {
        window.location.href = target;
      }, 1000);
    } catch (err) {
      setError(err.message || t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-white md:grid md:grid-cols-2">
      {/* Marketing panel — tablet & desktop */}
      <aside className="relative hidden h-full overflow-hidden bg-[#0f2a1f] md:flex md:flex-col">
        <img
          src="/hero-interior-1.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark green theme over the photo */}
        <div className="absolute inset-0 bg-[#14532d]/75" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0a1f16]/90 via-[#14532d]/55 to-[#1B4332]/40"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col px-6 py-7 lg:px-10 lg:py-9 xl:px-14 xl:py-11">
          <div className="self-start" {...aosFadeIn(0, 500)}>
            <BrandLogoLink
              className="rounded-2xl bg-white p-2.5 shadow-[0_10px_28px_-14px_rgba(0,0,0,0.45)] ring-1 ring-white/40 transition hover:bg-[#f8fbf9] md:p-3 lg:rounded-[1.25rem] lg:p-3.5"
              imgClassName="h-9 w-auto max-w-[10.5rem] object-contain object-left md:h-10 md:max-w-[12rem] lg:h-11 lg:max-w-[13.5rem]"
            />
          </div>

          <div className="mt-auto max-w-md pb-1">
            <h1
              className="text-[1.5rem] font-bold leading-[1.2] tracking-tight text-white lg:text-[1.875rem] xl:text-[2.15rem]"
              {...aosFadeRight(80, 650)}
            >
              {t('auth.login.panelTitle')}
            </h1>
            <p
              className="mt-2.5 text-sm leading-relaxed text-white/80 lg:mt-3"
              {...aosFadeRight(160, 650)}
            >
              {t('auth.login.panelSubtitle')}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4 lg:mt-8 lg:gap-x-6 lg:gap-y-5">
              {features.map((feature, index) => (
                <FeatureItem
                  key={feature.id}
                  icon={feature.icon}
                  label={feature.label}
                  aosDelay={220 + aosStagger(index, 70)}
                />
              ))}
            </div>

            <p className="mt-6 text-sm text-white/75 lg:mt-8" {...aosFadeUp(480, 550)}>
              <span className="font-semibold text-[#B7E4C7]">{t('auth.login.socialProofTitle')}</span>
              <span className="mx-2 text-white/35">·</span>
              {t('auth.login.socialProofSubtitle')}
            </p>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex h-full flex-col px-4 py-4 sm:px-8 md:px-6 lg:px-10 lg:py-6 xl:px-16">
        <div className="mx-auto flex h-full w-full max-w-[24rem] flex-col md:max-w-[22rem] lg:max-w-[24rem]">
          <div className="flex shrink-0 items-center justify-between" {...aosFadeIn(40, 450)}>
            <div className="md:hidden">
              <BrandLogoLink imgClassName="h-8 w-auto max-w-[9rem] object-contain object-left" />
            </div>
            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-[#2A7D4F] md:ml-0"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12.5 5l-5 5 5 5" />
              </svg>
              {t('common.back')}
            </Link>
          </div>

          <div className="flex flex-1 flex-col justify-center py-2">
            <div className="mb-5" {...aosFadeUp(80, 550)}>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.75rem]">{t('auth.login.title')}</h2>
              <p className="mt-1 text-sm text-gray-500">{t('auth.login.subtitle')}</p>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleLogIn} className="space-y-3.5">
              <div {...aosFadeUp(140, 550)}>
                <label htmlFor="login-phone" className="mb-1 block text-sm font-semibold text-gray-900">
                  {t('common.mobileNumber')}
                </label>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(clipPhoneInput(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#2A7D4F] focus:ring-2 focus:ring-[#2A7D4F]/20"
                  placeholder={t('common.phonePlaceholder')}
                  required
                />
                <p className="mt-1 text-[11px] leading-snug text-gray-500">{t('common.phoneHint')}</p>
              </div>

              <div {...aosFadeUp(200, 550)}>
                <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-gray-900">
                  {t('common.password')}
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#2A7D4F] focus:ring-2 focus:ring-[#2A7D4F]/20"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition hover:text-gray-600"
                    aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3" {...aosFadeUp(240, 550)}>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2A7D4F] focus:ring-[#2A7D4F]"
                  />
                  {t('auth.login.rememberMe')}
                </label>
                <Link
                  to="/forgot-password"
                  className="shrink-0 text-sm font-semibold text-[#2A7D4F] transition hover:text-[#245f43]"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>

              <div {...aosFadeUp(280, 550)}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#2A7D4F] py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(42,125,79,0.7)] transition hover:bg-[#245f43] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? t('auth.login.loggingIn') : t('common.logIn')}
                </button>
              </div>

              <div className="flex items-center gap-3 pt-0.5" {...aosFadeUp(320, 550)}>
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">{t('auth.login.orContinueWith')}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div {...aosFadeUp(360, 550)}>
                <GoogleAuthButton
                  mode="login"
                  label={t('auth.login.google')}
                  className="rounded-xl border-gray-200 py-2.5 text-sm font-semibold shadow-none"
                />
              </div>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500" {...aosFadeUp(400, 550)}>
              {t('auth.login.noAccount')}{' '}
              <Link to="/signup" className="font-semibold text-[#2A7D4F] transition hover:text-[#245f43]">
                {t('auth.login.signUpFree')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
