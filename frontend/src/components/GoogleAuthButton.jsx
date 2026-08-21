import { useTranslation } from '../lib/i18n';

const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_AUTH_URL || '';

export default function GoogleAuthButton({
  mode = 'login',
  role = 'TENANT',
  label: labelOverride,
  className = '',
}) {
  const { t } = useTranslation();
  const roleLabel = role === 'OWNER' ? t('auth.signup.owner') : t('auth.signup.tenant');
  const label =
    labelOverride ||
    (mode === 'signup'
      ? t('auth.googleButton.signUpAs', { role: roleLabel })
      : t('auth.googleButton.continueWithGoogle'));
  const isConfigured = Boolean(GOOGLE_AUTH_URL.trim());

  const handleClick = () => {
    if (!isConfigured) return;

    const callbackUrl = `${window.location.origin}/auth/callback`;
    const separator = GOOGLE_AUTH_URL.includes('?') ? '&' : '?';
    const target = `${GOOGLE_AUTH_URL}${separator}redirect_uri=${encodeURIComponent(callbackUrl)}&mode=${encodeURIComponent(mode)}&role=${encodeURIComponent(role)}`;
    window.location.href = target;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isConfigured}
      title={isConfigured ? t('auth.googleButton.continueWithGoogle') : t('auth.googleButton.notConfigured')}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 6.9 2 2.8 6.5 2.8 12s4.1 10 9.2 10c5.3 0 8.9-3.9 8.9-9.3 0-.6-.1-1.1-.2-1.6H12z"
        />
        <path
          fill="#34A853"
          d="M3.5 14.4l3.2-2.4C7.5 14.4 9.5 16 12 16c1.5 0 2.7-.5 3.6-1.3l3.3 2.5C17.3 18.8 14.9 20 12 20c-3.9 0-7.2-2.5-8.5-5.6z"
        />
        <path
          fill="#4A90E2"
          d="M20.9 12.1c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.2-1 2.2-1.9 2.9l3.3 2.5c1.9-1.8 3-4.4 3-7.7z"
        />
        <path
          fill="#FBBC05"
          d="M6.7 12c0-.7.1-1.4.3-2L3.8 7.6C3.1 8.9 2.8 10.4 2.8 12s.3 3.1 1 4.4l3.2-2.4c-.2-.6-.3-1.3-.3-2z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
