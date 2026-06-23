import { startTransition, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogoLink, { BRAND_LOGO_IMG_CLASS_COMPACT } from '../components/BrandLogoLink';
import { apiFetch, getCurrentUser, splitName } from '../lib/api';
import { useTranslation } from '../lib/i18n';
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
  { value: 'EMPLOYED', labelKey: 'registration.owner.employmentEmployed' },
  { value: 'SELF_EMPLOYED', labelKey: 'registration.owner.employmentSelfEmployed' },
  { value: 'UNEMPLOYED', labelKey: 'registration.owner.employmentUnemployed' },
  { value: 'STUDENT', labelKey: 'registration.owner.employmentStudent' },
  { value: 'RETIRED', labelKey: 'registration.owner.employmentRetired' },
];

const RELIGION_LABEL_KEYS = {
  Islam: 'registration.options.islam',
  Hinduism: 'registration.options.hinduism',
  Christianity: 'registration.options.christianity',
  Buddhism: 'registration.options.buddhism',
  Other: 'registration.options.other',
};

/**
 * Profession lines per employment; each maps to backend `JobCategory` + a short `profession` string for the API.
 * Owner create profile only accepts `profession` (string) + `jobCategory` (enum) — we derive both from these rows.
 */
const PROFESSION_ROWS_BY_EMPLOYMENT = {
  EMPLOYED: [
    { label: 'Engineer / technologist', labelKey: 'registration.professions.engineerTechnologist', jobCategory: 'TECHNOLOGY' },
    { label: 'Doctor / healthcare worker', labelKey: 'registration.professions.doctorHealthcare', jobCategory: 'HEALTHCARE' },
    { label: 'Teacher / academic', labelKey: 'registration.professions.teacherAcademic', jobCategory: 'EDUCATION' },
    { label: 'Finance / banking', labelKey: 'registration.professions.financeBanking', jobCategory: 'FINANCE' },
    { label: 'Construction / development', labelKey: 'registration.professions.constructionDevelopment', jobCategory: 'CONSTRUCTION' },
    { label: 'Hospitality / tourism', labelKey: 'registration.professions.hospitalityTourism', jobCategory: 'HOSPITALITY' },
    { label: 'Retail / sales', labelKey: 'registration.professions.retailSales', jobCategory: 'RETAIL' },
    { label: 'Government service', labelKey: 'registration.professions.governmentService', jobCategory: 'GOVERNMENT' },
    { label: 'Property / facilities manager (employed)', labelKey: 'registration.professions.propertyManager', jobCategory: 'OTHER' },
    { label: 'Other employed role', labelKey: 'registration.professions.otherEmployed', jobCategory: 'OTHER' },
  ],
  SELF_EMPLOYED: [
    { label: 'Property owner / landlord', labelKey: 'registration.professions.propertyOwner', jobCategory: 'SELF_EMPLOYED' },
    { label: 'Real estate broker / agent', labelKey: 'registration.professions.realEstateBroker', jobCategory: 'SELF_EMPLOYED' },
    { label: 'Business owner (general)', labelKey: 'registration.professions.businessOwner', jobCategory: 'OTHER' },
    { label: 'Consultant / freelancer', labelKey: 'registration.professions.consultantFreelancer', jobCategory: 'OTHER' },
    { label: 'Other self-employed', labelKey: 'registration.professions.otherSelfEmployed', jobCategory: 'OTHER' },
  ],
  UNEMPLOYED: [
    { label: 'Not currently working', labelKey: 'registration.professions.notWorking', jobCategory: 'OTHER' },
    { label: 'Looking for work', labelKey: 'registration.professions.lookingForWork', jobCategory: 'OTHER' },
  ],
  STUDENT: [
    { label: 'Full-time student', labelKey: 'registration.professions.fullTimeStudent', jobCategory: 'OTHER' },
    { label: 'Student with part-time work', labelKey: 'registration.professions.studentPartTime', jobCategory: 'RETAIL' },
  ],
  RETIRED: [
    { label: 'Retired', labelKey: 'registration.professions.retired', jobCategory: 'OTHER' },
    { label: 'Retired — previously in property / real estate', labelKey: 'registration.professions.retiredProperty', jobCategory: 'SELF_EMPLOYED' },
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
  const { t } = useTranslation();
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
    if (name === 'workSelection') {
      const [employmentFromSelection] = String(value).split('|');
      setForm((prev) => ({
        ...prev,
        employmentStatus: prev.employmentStatus || employmentFromSelection || prev.employmentStatus,
        workSelection: value,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const professionRows =
    form.employmentStatus && PROFESSION_ROWS_BY_EMPLOYMENT[form.employmentStatus]
      ? PROFESSION_ROWS_BY_EMPLOYMENT[form.employmentStatus]
      : [];

  function parseWorkSelection(raw) {
    const parts = String(raw || '').split('|');
    if (parts.length < 3) return null;
    const [, jobCategory, ...labelParts] = parts;
    const roleLabel = labelParts.join('|');
    if (!jobCategory || !roleLabel) return null;
    return { jobCategory, roleLabel };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.userId) {
        setError(t('common.notAuthenticated'));
        return;
      }

      const suffix = digitsOnly(form.phoneAfter880);
      if (!/^1[3-9]\d{8}$/.test(suffix)) {
        setError(t('common.phoneAfter880Error'));
        return;
      }

      if (!form.dateOfBirth) {
        setError(t('registration.owner.dobRequired'));
        return;
      }
      if (!form.religion || !form.employmentStatus || !form.workSelection || !form.currentLocation) {
        setError(t('registration.owner.fieldsRequired'));
        return;
      }

      const parsed = parseWorkSelection(form.workSelection);
      if (!parsed?.jobCategory || !parsed?.roleLabel) {
        setError(t('registration.owner.roleRequired'));
        return;
      }

      const { firstName, lastName } = splitName(form.fullName);
      if (!firstName || firstName.length < 2) {
        setError(t('registration.owner.nameRequired'));
        return;
      }

      const empOption = EMPLOYMENT_STATUS_OPTIONS.find((o) => o.value === form.employmentStatus);
      const empLabel = empOption ? t(empOption.labelKey) : form.employmentStatus;
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
          currentLat: 23.8103,
          currentLng: 90.4125,
          currentArea: form.currentLocation,
          ownerCategory,
          role: 'OWNER',
        }),
      });

      if (!ownerRes.ok) {
        const data = await ownerRes.json().catch(() => ({}));
        throw new Error(data.error || data.message || t('registration.owner.profileFailed'));
      }

      window.location.href = '/verification?role=OWNER';
    } catch (err) {
      setError(err.message || t('common.unexpectedError'));
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
          <BrandLogoLink />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="text-gray-700 hover:text-emerald-700 transition">
              {t('common.home')}
            </Link>
            <Link to="/listings" className="text-gray-700 hover:text-emerald-700 transition">
              {t('common.findProperty')}
            </Link>
            <Link to="/owner-dashboard/create-listing" className="text-gray-700 hover:text-emerald-700 transition">
              {t('common.listProperty')}
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-700 transition">
              {t('common.services')}
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="px-3 sm:px-5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {t('common.login')}
            </Link>
            <Link
              to="/signup"
              className="px-3 sm:px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition"
            >
              {t('common.signUp')}
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 transition"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? t('common.closeMenu') : t('common.openMenu')}
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
            aria-label={t('common.closeMenu')}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="owner-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#eef4ef] px-5 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <BrandLogoLink
                  imgClassName={BRAND_LOGO_IMG_CLASS_COMPACT}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <span id="owner-mobile-nav-title" className="sr-only">
                  {t('common.mainMenu')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label={t('common.closeMenu')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-1" aria-label={t('common.mobile')}>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[#2f8444] bg-[#eef7ef]"
              >
                {t('common.home')}
              </Link>
              <Link
                to="/listings"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                {t('common.findProperty')}
              </Link>
              <Link
                to="/owner-dashboard/create-listing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                {t('common.listProperty')}
              </Link>
              <Link
                to="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                {t('common.services')}
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition"
              >
                {t('common.signUp')}
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-10">
          <aside className="rounded-3xl bg-gradient-to-b from-[#eef8f1] to-[#e2f2e8] border border-emerald-100 p-5 shadow-sm">
            <h2 className="text-4xl font-extrabold leading-tight text-emerald-900">{t('registration.owner.sidebarTitle')}</h2>
            <p className="mt-4 text-emerald-700 text-lg">
              {t('registration.owner.sidebarDesc')}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">{t('registration.owner.listProperties')}</p>
              </div>
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-6 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">{t('registration.owner.talkToTenants')}</p>
              </div>
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">{t('registration.owner.verifiedOnboarding')}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl overflow-hidden border border-emerald-100 bg-white p-2">
              <img src={SIDE_IMAGE} alt={t('registration.owner.sidebarImageAlt')} className="w-full h-90% object-cover rounded-xl" />
            </div>
          </aside>

          <section className="rounded-3xl bg-white border border-gray-100 shadow-[0_10px_28px_rgba(15,23,42,0.08)] p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-800 tracking-tight">{t('registration.owner.pageTitle')}</h1>
              <div className="flex items-center gap-4">
                <StepItem number={1} label={t('common.details')} active />
                <span className="text-gray-300">—</span>
                <StepItem number={2} label={t('common.verify')} />
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-gray-600 border-b border-gray-100 pb-4">
                {t('registration.owner.formIntro')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>{t('common.fullName')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder={t('registration.owner.fullNamePlaceholder')}
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
                  <label className={labelClass}>{t('common.mobileNumber')}</label>
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
                      placeholder={t('common.phoneAfter880Placeholder')}
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t('common.phoneAfter880Hint')}</p>
                </div>

                <div>
                  <label className={labelClass}>{t('common.dateOfBirth')}</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className={`${inputClass} [color-scheme:light]`}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>{t('common.gender')}</label>
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
                        <span>{t(`common.${g}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{t('common.religion')}</label>
                  <select name="religion" value={form.religion} onChange={handleChange} className={inputClass} required>
                    <option value="">{t('common.selectReligion')}</option>
                    {RELIGION_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {t(RELIGION_LABEL_KEYS[item] || 'registration.options.other')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>{t('common.bloodGroup')}</label>
                  <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className={inputClass}>
                    <option value="">{t('common.selectBloodGroupOptional')}</option>
                    {BLOOD_GROUP_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('registration.owner.bloodGroupNote')}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>{t('registration.owner.employment')}</label>
                  <select
                    name="employmentStatus"
                    value={form.employmentStatus}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">{t('registration.owner.selectEmployment')}</option>
                    {EMPLOYMENT_STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('registration.owner.employmentNote')}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>{t('registration.owner.roleProfession')}</label>
                  <select
                    name="workSelection"
                    value={form.workSelection}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">
                      {form.employmentStatus ? t('registration.owner.selectRoleBest') : t('registration.owner.chooseEmploymentFirst')}
                    </option>
                    {professionRows.map((row) => (
                      <option
                        key={`${form.employmentStatus}-${row.jobCategory}-${row.label}`}
                        value={`${form.employmentStatus}|${row.jobCategory}|${row.label}`}
                      >
                        {t(row.labelKey)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('registration.owner.roleNote')}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>{t('registration.owner.primaryArea')}</label>
                  <select
                    name="currentLocation"
                    value={form.currentLocation}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">{t('registration.owner.whereBased')}</option>
                    {LOCATION_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  to="/signup"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold flex items-center justify-center hover:bg-gray-50 transition"
                >
                  {t('common.back')}
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.saving') : t('common.continue')}
                </button>
              </div>

              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5z" />
                </svg>
                {t('registration.owner.nextStepNote')}
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

