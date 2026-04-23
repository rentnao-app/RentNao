import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, getApiErrorMessage } from '../lib/api';

export default function AuthVerificationPage() {
  const [searchParams] = useSearchParams();
  const defaultIdentifier = searchParams.get('identifier') || '';
  const defaultType = searchParams.get('type') === 'PHONE' ? 'PHONE' : 'EMAIL';

  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [type, setType] = useState(defaultType);
  const [emailToken, setEmailToken] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tokenLabel = useMemo(() => (type === 'EMAIL' ? 'Email Verification Token' : 'SMS OTP (6 digits)'), [type]);

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          type,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, 'Could not resend verification'));
      }
      setSuccess(body?.message || `Verification ${type === 'EMAIL' ? 'email' : 'OTP'} sent`);
    } catch (err) {
      setError(err.message || 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = type === 'EMAIL' ? '/auth/verify-email' : '/auth/verify-phone';
      const token = type === 'EMAIL' ? emailToken.trim() : phoneOtp.trim();
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(body, 'Verification failed'));
      }
      setSuccess(body?.message || 'Verification successful.');
      if (type === 'EMAIL') setEmailToken('');
      else setPhoneOtp('');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition">
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Verify Contact</h1>
          <p className="text-gray-500 text-center mb-8">Verify email or mobile to activate your account fully.</p>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setType('EMAIL')}
                className={`py-2 rounded-lg text-sm font-medium border ${type === 'EMAIL' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-700 border-gray-200'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setType('PHONE')}
                className={`py-2 rounded-lg text-sm font-medium border ${type === 'PHONE' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-700 border-gray-200'}`}
              >
                Mobile OTP
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {type === 'EMAIL' ? 'Email Address' : 'Mobile Number'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={type === 'EMAIL' ? 'user@example.com' : '01XXXXXXXXX'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || !identifier.trim()}
                  className="mt-2 text-sm text-teal-700 hover:text-teal-800 font-semibold disabled:opacity-50"
                >
                  Resend {type === 'EMAIL' ? 'Email Token' : 'OTP'}
                </button>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{tokenLabel}</label>
                  <input
                    type="text"
                    value={type === 'EMAIL' ? emailToken : phoneOtp}
                    onChange={(e) => (type === 'EMAIL' ? setEmailToken(e.target.value) : setPhoneOtp(e.target.value))}
                    placeholder={type === 'EMAIL' ? 'Enter email token' : 'Enter 6-digit OTP'}
                    maxLength={type === 'PHONE' ? 6 : 128}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
