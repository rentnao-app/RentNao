import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getCurrentUser, splitName } from '../lib/api';

const CONTACT_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'both', label: 'Both' },
];

const PROPERTY_FOCUS_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'both', label: 'Both' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'first-time', label: 'First-time Owner' },
  { value: 'experienced', label: 'Experienced' },
  { value: 'professional', label: 'Professional Landlord' },
];

const SIDE_IMAGE = '/side-image.jpg';

function StepItem({ number, label, active }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
          active ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {number}
      </span>
      <span className={`text-sm ${active ? 'text-emerald-700 font-semibold' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

export default function OwnerRegistrationPage() {
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    preferredContact: '',
    propertyFocus: '',
    experienceLevel: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.userId) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const { firstName, lastName } = splitName(form.fullName);
      const ownerCategory = form.propertyFocus === 'commercial' ? 'COMMERCIAL' : 'RESIDENTIAL';

      const ownerRes = await apiFetch(`/users/${currentUser.userId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth: '1990-01-01',
          gender: 'OTHER',
          religion: 'Not specified',
          profession: 'Property Owner',
          jobCategory: 'OTHER',
          profilePhotoUrl: 'https://example.com/profile.jpg',
          currentLat: 23.8103,
          currentLng: 90.4125,
          currentArea: 'Dhaka',
          ownerCategory,
          role: 'OWNER',
        }),
      });

      if (!ownerRes.ok) {
        const data = await ownerRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create owner profile');
      }

      window.location.href = '/verification?role=OWNER';
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      {/* UPDATED HEADER */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Rent Nao" className="h-10 w-10 rounded-md object-cover border border-emerald-100" />
            <span className="text-3xl font-extrabold text-emerald-800 tracking-tight">Rent Nao</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="text-gray-700 hover:text-emerald-700 transition">Home</Link>
            <Link to="/listings" className="text-gray-700 hover:text-emerald-700 transition">Find Property</Link>
            <Link to="/owner-dashboard/create-listing" className="text-gray-700 hover:text-emerald-700 transition">List Property</Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-700 transition">Services</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          {/* Left panel */}
          <aside className="rounded-3xl bg-gradient-to-b from-[#eef8f1] to-[#e2f2e8] border border-emerald-100 p-5 shadow-sm">
            <h2 className="text-4xl font-extrabold leading-tight text-emerald-900">Create Your Owner Profile</h2>
            <p className="mt-4 text-emerald-700 text-lg">
              Share a few details to complete your owner onboarding quickly.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">List Properties</p>
              </div>

              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-6 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">Talk to Tenants</p>
              </div>

              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">Safe & Secure</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl overflow-hidden border border-emerald-100 bg-white p-2">
              <img src={SIDE_IMAGE} alt="Owner registration visual" className="w-full h-90% object-cover rounded-xl" />
            </div>
          </aside>

          {/* Right panel */}
          <section className="rounded-3xl bg-white border border-gray-100 shadow-[0_10px_28px_rgba(15,23,42,0.08)] p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-800 tracking-tight">Owner Information</h1>
              <div className="flex items-center gap-4">
                <StepItem number={1} label="Details" active />
                <span className="text-gray-300">—</span>
                <StepItem number={2} label="Verify" />
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+880..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Preferred Contact Method</label>
                  <select name="preferredContact" value={form.preferredContact} onChange={handleChange} className={inputClass}>
                    <option value="">Select</option>
                    {CONTACT_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Property Focus</label>
                  <select name="propertyFocus" value={form.propertyFocus} onChange={handleChange} className={inputClass}>
                    <option value="">Select</option>
                    {PROPERTY_FOCUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Experience Level</label>
                  <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} className={inputClass}>
                    <option value="">Select</option>
                    {EXPERIENCE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Link
                  to="/signup"
                  className="h-11 px-6 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold flex items-center justify-center hover:bg-gray-50 transition"
                >
                  ← Back
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Continue →'}
                </button>
              </div>

              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5z" />
                </svg>
                Your information is safe and secure
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
