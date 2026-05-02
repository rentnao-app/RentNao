import { startTransition, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, getCurrentUser, splitName } from '../lib/api';
import {
  clearPendingSignupPhone,
  clipPhoneInput,
  consumeSignupPhoneLocal11,
  digitsOnly,
  isValidBdMobileLocal11,
  local11ToAfter880,
  toLocal11Digits,
} from '../lib/phone';

/** Matches backend `createOwnerProfileSchema` / Prisma `AreaName`-style areas for UX */
const LOCATION_OPTIONS = [
  'Dhanmondi',
  'Gulshan',
  'Banani',
  'Uttara',
  'Mirpur',
  'Mohammadpur',
  'Bashundhara',
  'Badda',
];

const RELIGION_OPTIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other'];

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** Backend `EmploymentStatus` (same enum family as tenant profiles) — drives profession choices. */
const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'RETIRED', label: 'Retired' },
];

/**
 * Profession lines per employment; each maps to backend `JobCategory` + a short `profession` string for the API.
 * Owner create profile only accepts `profession` (string) + `jobCategory` (enum) — we derive both from these rows.
 */
const PROFESSION_ROWS_BY_EMPLOYMENT = {
  EMPLOYED: [
    { label: 'Engineer / technologist', jobCategory: 'TECHNOLOGY' },
    { label: 'Doctor / healthcare worker', jobCategory: 'HEALTHCARE' },
    { label: 'Teacher / academic', jobCategory: 'EDUCATION' },
    { label: 'Finance / banking', jobCategory: 'FINANCE' },
    { label: 'Construction / development', jobCategory: 'CONSTRUCTION' },
    { label: 'Hospitality / tourism', jobCategory: 'HOSPITALITY' },
    { label: 'Retail / sales', jobCategory: 'RETAIL' },
    { label: 'Government service', jobCategory: 'GOVERNMENT' },
    { label: 'Property / facilities manager (employed)', jobCategory: 'OTHER' },
    { label: 'Other employed role', jobCategory: 'OTHER' },
  ],
  SELF_EMPLOYED: [
    { label: 'Property owner / landlord', jobCategory: 'SELF_EMPLOYED' },
    { label: 'Real estate broker / agent', jobCategory: 'SELF_EMPLOYED' },
    { label: 'Business owner (general)', jobCategory: 'OTHER' },
    { label: 'Consultant / freelancer', jobCategory: 'OTHER' },
    { label: 'Other self-employed', jobCategory: 'OTHER' },
  ],
  UNEMPLOYED: [
    { label: 'Not currently working', jobCategory: 'OTHER' },
    { label: 'Looking for work', jobCategory: 'OTHER' },
  ],
  STUDENT: [
    { label: 'Full-time student', jobCategory: 'OTHER' },
    { label: 'Student with part-time work', jobCategory: 'RETAIL' },
  ],
  RETIRED: [
    { label: 'Retired', jobCategory: 'OTHER' },
    { label: 'Retired — previously in property / real estate', jobCategory: 'SELF_EMPLOYED' },
  ],
};

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

function Icon({ children }) {
  return <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">{children}</span>;
}

export default function OwnerRegistrationPage() {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    fullName: '',
    phoneAfter880: '',
    dateOfBirth: '',
    gender: 'male',
    religion: '',
    bloodGroup: '',
    employmentStatus: '',
    /** `jobCategory|roleLabel` — roleLabel has no `|` */
    workSelection: '',
    currentLocation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get('phone');
    if (fromQuery) clearPendingSignupPhone();
    const fromSession = fromQuery ? '' : consumeSignupPhoneLocal11();
    const user = getCurrentUser();
    const fromUser = user?.contactPhone || user?.contact_phone || '';
    const raw = fromQuery || fromSession || fromUser;
    const local11 = toLocal11Digits(clipPhoneInput(raw));
    if (!local11 || !isValidBdMobileLocal11(local11)) return;
    const after = local11ToAfter880(local11);
    startTransition(() => {
      setForm((prev) => ({ ...prev, phoneAfter880: after }));
    });
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'employmentStatus') {
      setForm((prev) => ({ ...prev, employmentStatus: value, workSelection: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const professionRows =
    form.employmentStatus && PROFESSION_ROWS_BY_EMPLOYMENT[form.employmentStatus]
      ? PROFESSION_ROWS_BY_EMPLOYMENT[form.employmentStatus]
      : [];

  function parseWorkSelection(raw) {
    const i = raw.indexOf('|');
    if (i <= 0 || i >= raw.length - 1) return null;
    return { jobCategory: raw.slice(0, i), roleLabel: raw.slice(i + 1) };
  }

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

      const suffix = digitsOnly(form.phoneAfter880);
      if (!/^1[3-9]\d{8}$/.test(suffix)) {
        setError(
          'Enter the 10 digits after +880 (e.g. 1712345678). Your full number must be a valid 01… mobile.'
        );
        return;
      }

      if (!form.dateOfBirth) {
        setError('Please select your date of birth.');
        return;
      }
      if (!form.religion || !form.employmentStatus || !form.workSelection || !form.currentLocation) {
        setError('Please complete all required fields.');
        return;
      }

      const parsed = parseWorkSelection(form.workSelection);
      if (!parsed?.jobCategory || !parsed?.roleLabel) {
        setError('Please select your role or profession for your employment type.');
        return;
      }

      const { firstName, lastName } = splitName(form.fullName);
      if (!firstName || firstName.length < 2) {
        setError('Please enter your full name (at least 2 characters for your first name).');
        return;
      }

      const empLabel =
        EMPLOYMENT_STATUS_OPTIONS.find((o) => o.value === form.employmentStatus)?.label ||
        form.employmentStatus;
      const professionPayload = `${empLabel}: ${parsed.roleLabel}`.slice(0, 100);

      const ownerCategory = 'RESIDENTIAL';

      const mapGender = { male: 'MALE', female: 'FEMALE', other: 'OTHER' };

      const ownerRes = await apiFetch(`/users/${currentUser.userId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth: form.dateOfBirth,
          gender: mapGender[form.gender] || 'OTHER',
          religion: form.religion,
          profession: professionPayload,
          jobCategory: parsed.jobCategory,
          profilePhotoUrl: 'https://example.com/profile.jpg',
          currentLat: 23.8103,
          currentLng: 90.4125,
          currentArea: form.currentLocation,
          ownerCategory,
          role: 'OWNER',
        }),
      });

      if (!ownerRes.ok) {
        const data = await ownerRes.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to create owner profile');
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
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Rent Nao" className="h-10 w-10 rounded-md object-cover border border-emerald-100" />
            <span className="text-xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight leading-none">Rent Nao</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="text-gray-700 hover:text-emerald-700 transition">
              Home
            </Link>
            <Link to="/listings" className="text-gray-700 hover:text-emerald-700 transition">
              Find Property
            </Link>
            <Link to="/owner-dashboard/create-listing" className="text-gray-700 hover:text-emerald-700 transition">
              List Property
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-700 transition">
              Services
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="px-3 sm:px-5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-3 sm:px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition"
            >
              Sign Up
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 transition"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="owner-mobile-nav"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px] motion-reduce:backdrop-blur-none animate-mobile-nav-backdrop motion-reduce:animate-none motion-reduce:opacity-100"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="owner-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eef4ef]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover border border-green-100 shrink-0" />
                <p id="owner-mobile-nav-title" className="font-semibold text-[#1e4732] text-sm tracking-tight truncate">
                  Rent Nao
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-1" aria-label="Mobile">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[#2f8444] bg-[#eef7ef]"
              >
                Home
              </Link>
              <Link
                to="/listings"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                Find Property
              </Link>
              <Link
                to="/owner-dashboard/create-listing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                List Property
              </Link>
              <Link
                to="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                Services
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition"
              >
                Sign Up
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-10">
          <aside className="rounded-3xl bg-gradient-to-b from-[#eef8f1] to-[#e2f2e8] border border-emerald-100 p-5 shadow-sm">
            <h2 className="text-4xl font-extrabold leading-tight text-emerald-900">Create your owner profile</h2>
            <p className="mt-4 text-emerald-700 text-lg">
              We collect the same core profile details as for tenants, plus how you plan to use RentNao—so verification
              and matching stay accurate.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">List properties</p>
              </div>
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-6 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">Talk to tenants</p>
              </div>
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">Verified onboarding</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl overflow-hidden border border-emerald-100 bg-white p-2">
              <img src={SIDE_IMAGE} alt="Owner registration visual" className="w-full h-90% object-cover rounded-xl" />
            </div>
          </aside>

          <section className="rounded-3xl bg-white border border-gray-100 shadow-[0_10px_28px_rgba(15,23,42,0.08)] p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-800 tracking-tight">Owner information</h1>
              <div className="flex items-center gap-4">
                <StepItem number={1} label="Details" active />
                <span className="text-gray-300">—</span>
                <StepItem number={2} label="Verify" />
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-gray-600 border-b border-gray-100 pb-4">
                Complete your details so we can verify your account and match you with tenants.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Full name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="As on your NID / documents"
                      required
                    />
                    <Icon>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.01-8 4.5V21h16v-2.5C20 16.01 16.42 14 12 14z" />
                      </svg>
                    </Icon>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Mobile number</label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-3 bg-gray-50 border-r border-gray-200 flex items-center text-sm text-gray-600">+880</div>
                    <input
                      type="tel"
                      name="phoneAfter880"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.phoneAfter880}
                      onChange={(e) => {
                        const d = digitsOnly(e.target.value).slice(0, 10);
                        setForm((prev) => ({ ...prev, phoneAfter880: d }));
                      }}
                      className="w-full px-3 py-3 text-sm outline-none"
                      placeholder="1712345678"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">10 digits after +880 (same mobile you used to sign up).</p>
                </div>

                <div>
                  <label className={labelClass}>Date of birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                    <Icon>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2zm13 8H4v10h16V10z" />
                      </svg>
                    </Icon>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <div className="flex items-center gap-5 h-[50px] rounded-xl border border-gray-200 px-3">
                    {['male', 'female', 'other'].map((g) => (
                      <label key={g} className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={form.gender === g}
                          onChange={handleChange}
                          className="accent-emerald-700"
                        />
                        <span className="capitalize">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Religion</label>
                  <select name="religion" value={form.religion} onChange={handleChange} className={inputClass} required>
                    <option value="">Select religion</option>
                    {RELIGION_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Blood group</label>
                  <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className={inputClass}>
                    <option value="">Select blood group (optional)</option>
                    {BLOOD_GROUP_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Same field as tenant onboarding; owner API does not store it yet.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Employment</label>
                  <select
                    name="employmentStatus"
                    value={form.employmentStatus}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select employment status</option>
                    {EMPLOYMENT_STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Uses the same <span className="font-medium text-gray-700">EmploymentStatus</span> idea as tenants;
                    we then map your answer to <span className="font-medium text-gray-700">profession</span> +{' '}
                    <span className="font-medium text-gray-700">jobCategory</span> for the owner profile API.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Role / profession</label>
                  <select
                    name="workSelection"
                    value={form.workSelection}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    disabled={!form.employmentStatus}
                  >
                    <option value="">
                      {form.employmentStatus ? 'Select the option that best describes you' : 'Choose employment first'}
                    </option>
                    {professionRows.map((row) => (
                      <option key={`${row.jobCategory}-${row.label}`} value={`${row.jobCategory}|${row.label}`}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Each option sets the backend <span className="font-medium text-gray-700">jobCategory</span> enum and
                    a clear <span className="font-medium text-gray-700">profession</span> string.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Primary area (current)</label>
                  <div className="relative">
                    <select
                      name="currentLocation"
                      value={form.currentLocation}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Where are you based?</option>
                      {LOCATION_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <Icon>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z" />
                      </svg>
                    </Icon>
                  </div>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  to="/signup"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold flex items-center justify-center hover:bg-gray-50 transition"
                >
                  Back
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>

              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5z" />
                </svg>
                Your information is safe and secure. Next: upload owner verification documents (NID + proof of ownership).
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

