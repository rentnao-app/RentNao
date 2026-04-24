const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_AUTH_URL || '';

export default function GoogleAuthButton({ mode = 'login', role = 'TENANT' }) {
  const label = mode === 'signup' ? `Sign up as ${role.toLowerCase()} with Google` : 'Continue with Google';
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
      title={isConfigured ? 'Continue with Google' : 'Google auth is not configured yet'}
      className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 6.9 2 2.8 6.5 2.8 12s4.1 10 9.2 10c5.3 0 8.9-3.9 8.9-9.3 0-.6-.1-1.1-.2-1.6H12z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
