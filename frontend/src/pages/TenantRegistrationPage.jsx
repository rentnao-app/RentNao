import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch, getCurrentUser, splitName } from "../lib/api";
import {
  clearPendingSignupPhone,
  clipPhoneInput,
  consumeSignupPhoneLocal11,
  digitsOnly,
  isValidBdMobileLocal11,
  local11ToAfter880,
  toLocal11Digits,
} from "../lib/phone";

const LOCATION_OPTIONS = [
  "Dhanmondi",
  "Gulshan",
  "Banani",
  "Uttara",
  "Mirpur",
  "Mohammadpur",
  "Bashundhara",
  "Badda",
];

const RELIGION_OPTIONS = [
  "Islam",
  "Hinduism",
  "Christianity",
  "Buddhism",
  "Other",
];

const PROFESSION_OPTIONS = [
  "Job",
  "Finance",
  "Accountant",
  "Engineer",
  "Architect",
  "Banker",
  "Lawyer",
  "Doctor",
  "Teacher",
  "Business",
  "Student",
  "Government Service",
  "Freelancer",
  "Other",
];

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const SIDE_IMAGE =
  "https://images.unsplash.com/photo-1616594039964-3f6d3b764de3?auto=format&fit=crop&w=1000&q=80";

function StepItem({ number, label, active }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
          active ? "bg-emerald-700 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {number}
      </span>
      <span
        className={`text-sm ${active ? "text-emerald-700 font-semibold" : "text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
}

function Icon({ children }) {
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
      {children}
    </span>
  );
}

export default function TenantRegistrationPage() {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "male",
    familyType: "family",
    familySize: "",
    bloodGroup: "",
    currentLocation: "",
    tenantCategory: "residential",
    incomeRange: "",
    religion: "",
    profession: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFamilyType = form.familyType === "family";

  useEffect(() => {
    const fromQuery = searchParams.get("phone");
    if (fromQuery) clearPendingSignupPhone();
    const fromSession = fromQuery ? "" : consumeSignupPhoneLocal11();
    const user = getCurrentUser();
    const fromUser = user?.contactPhone || user?.contact_phone || "";
    const raw = fromQuery || fromSession || fromUser;
    const local11 = toLocal11Digits(clipPhoneInput(raw));
    if (!local11 || !isValidBdMobileLocal11(local11)) return;
    setForm((prev) => ({
      ...prev,
      phoneNumber: local11ToAfter880(local11),
    }));
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const adjustFamilySize = (delta) => {
    if (!isFamilyType) return;
    const current = Number(form.familySize) || 1;
    const next = Math.max(1, current + delta);
    setForm((prev) => ({ ...prev, familySize: String(next) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.userId) {
        setError("Not authenticated. Please log in again.");
        return;
      }

      const suffix = digitsOnly(form.phoneNumber);
      if (!/^1[3-9]\d{8}$/.test(suffix)) {
        setError(
          "Enter the 10 digits after +880 (e.g. 1712345678). Your full number must be a valid 01… mobile."
        );
        return;
      }

      const { firstName, lastName } = splitName(form.fullName);

      const mapIncome = {
        "0-20000": "BELOW_20K",
        "20000-50000": "RANGE_20K_40K",
        "50000-100000": "RANGE_60K_100K",
        "100000+": "ABOVE_200K",
      };

      const mapGender = { male: "MALE", female: "FEMALE", other: "OTHER" };
      const mapFamily = { bachelor: "BACHELOR", family: "FAMILY" };

      const tenantRes = await apiFetch(`/users/${currentUser.userId}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth: form.dateOfBirth || "1995-01-01",
          gender: mapGender[form.gender] || "OTHER",
          religion: form.religion || "Not specified",
          profession: form.profession || "Not specified",
          jobCategory: "OTHER",
          profilePhotoUrl: "https://example.com/profile.jpg",
          currentLat: 23.8103,
          currentLng: 90.4125,
          currentArea: form.currentLocation || "Dhaka",
          incomeRange: mapIncome[form.incomeRange] || "RANGE_20K_40K",
          employmentStatus: "EMPLOYED",
          familyStatus: mapFamily[form.familyType] || "BACHELOR",
          familySize: isFamilyType ? Number(form.familySize || 1) : 1,
          role: "TENANT",
        }),
      });

      if (!tenantRes.ok) {
        const data = await tenantRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create tenant profile");
      }

      window.location.href = "/verification?role=TENANT";
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Rent Nao"
              className="h-10 w-10 rounded-md object-cover border border-emerald-100"
            />
            <span className="text-xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight leading-none">
              Rent Nao
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link
              to="/"
              className="text-gray-700 hover:text-emerald-700 transition"
            >
              Home
            </Link>
            <Link
              to="/listings"
              className="text-gray-700 hover:text-emerald-700 transition"
            >
              Find Property
            </Link>
            <Link
              to="/owner-dashboard/create-listing"
              className="text-gray-700 hover:text-emerald-700 transition"
            >
              List Property
            </Link>
            <Link
              to="/services"
              className="text-gray-700 hover:text-emerald-700 transition"
            >
              Services
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-2 md:gap-2.5 lg:gap-3 shrink-0">
            <Link
              to="/login"
              className="px-3 md:px-4 lg:px-5 py-2 rounded-xl border border-gray-200 text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-3 md:px-4 lg:px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs md:text-sm font-semibold hover:bg-emerald-800 transition"
            >
              Sign Up
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 transition"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="tenant-mobile-nav"
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
            id="tenant-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eef4ef]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover border border-green-100 shrink-0" />
                <p id="tenant-mobile-nav-title" className="font-semibold text-[#1e4732] text-sm tracking-tight truncate">
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

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-10">
          {/* Left panel */}
          <aside className="rounded-3xl bg-gradient-to-b from-[#eef8f1] to-[#e2f2e8] border border-emerald-100 p-5 shadow-sm">
            <h2 className="text-4xl font-extrabold leading-tight text-emerald-900">
              Create Your Tenant Profile
            </h2>
            <p className="mt-4 text-emerald-700 text-lg">
              Tell us about yourself to get the best matching properties
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">
                  Verified Listings
                </p>
              </div>

              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-6 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">
                  Direct Contact
                </p>
              </div>

              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                <div className="text-emerald-700 mb-1 flex justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-700">
                  Safe & Secure
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm">
              <div className="relative h-[260px] sm:h-[300px] lg:h-[340px] overflow-hidden rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100">
                <img
                  src="/side-image.jpg"
                  alt="Tenant profile side visual"
                  className="w-full h-90% object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>
            </div>
          </aside>

          {/* Form panel */}
          <section className="rounded-3xl bg-white border border-gray-100 shadow-[0_10px_28px_rgba(15,23,42,0.08)] p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
                Tenant Information
              </h3>
              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-3">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <StepItem number={1} label="Details" active />
                  <span className="hidden sm:inline text-gray-300">-</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <StepItem number={2} label="Preferences" />
                  <span className="hidden sm:inline text-gray-300">-</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start">
                  <StepItem number={3} label="Finish" />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter your full name"
                      required
                    />
                    <Icon>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.01-8 4.5V21h16v-2.5C20 16.01 16.42 14 12 14z" />
                      </svg>
                    </Icon>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className={`${inputClass} pr-11 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0`}
                    />
                    <Icon>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2zm13 8H4v10h16V10z" />
                      </svg>
                    </Icon>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="flex items-center flex-wrap gap-5 min-h-[50px] rounded-xl border border-gray-200 bg-gray-50/40 px-3 py-2">
                    {["male", "female", "other"].map((g) => (
                      <label
                        key={g}
                        className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                      >
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30">
                    <div className="px-3 bg-gray-50 border-r border-gray-200 flex items-center text-sm text-gray-600">
                      +880
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.phoneNumber}
                      onChange={(e) => {
                        const d = digitsOnly(e.target.value).slice(0, 10);
                        setForm((prev) => ({ ...prev, phoneNumber: d }));
                      }}
                      className="w-full px-3 py-3 text-sm outline-none"
                      placeholder="1712345678"
                    />
                  </div>
                </div>

                {/* Family/Bachelor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Family / Bachelor
                  </label>
                  <div className="flex items-center flex-wrap gap-6 min-h-[50px] rounded-xl border border-gray-200 bg-gray-50/40 px-3 py-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="familyType"
                        value="family"
                        checked={form.familyType === "family"}
                        onChange={handleChange}
                        className="accent-emerald-700"
                      />
                      Family
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="familyType"
                        value="bachelor"
                        checked={form.familyType === "bachelor"}
                        onChange={handleChange}
                        className="accent-emerald-700"
                      />
                      Bachelor
                    </label>
                  </div>
                </div>

                {/* Family size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Family Size (if applicable)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustFamilySize(-1)}
                      disabled={!isFamilyType}
                      className="h-[50px] w-12 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      name="familySize"
                      value={isFamilyType ? form.familySize || "1" : "N/A"}
                      readOnly
                      className={`${inputClass} text-center`}
                    />
                    <button
                      type="button"
                      onClick={() => adjustFamilySize(1)}
                      disabled={!isFamilyType}
                      className="h-[50px] w-12 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Blood group */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUP_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Location
                  </label>
                  <div className="relative">
                    <select
                      name="currentLocation"
                      value={form.currentLocation}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">City, Area, Flat No.</option>
                      {LOCATION_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <Icon>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z" />
                      </svg>
                    </Icon>
                  </div>
                </div>

                {/* Tenant category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tenant Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          tenantCategory: "residential",
                        }))
                      }
                      className={`h-[50px] rounded-xl border text-sm font-semibold transition ${
                        form.tenantCategory === "residential"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Residential
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          tenantCategory: "commercial",
                        }))
                      }
                      className={`h-[50px] rounded-xl border text-sm font-semibold transition ${
                        form.tenantCategory === "commercial"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Commercial
                    </button>
                  </div>
                </div>

                {/* Income */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Income Range
                  </label>
                  <select
                    name="incomeRange"
                    value={form.incomeRange}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select income range</option>
                    <option value="0-20000">0 - 20,000</option>
                    <option value="20000-50000">20,000 - 50,000</option>
                    <option value="50000-100000">50,000 - 100,000</option>
                    <option value="100000+">100,000+</option>
                  </select>
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Religion
                  </label>
                  <select
                    name="religion"
                    value={form.religion}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select religion</option>
                    {RELIGION_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profession */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profession
                  </label>
                  <select
                    name="profession"
                    value={form.profession}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select profession</option>
                    {PROFESSION_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-[340px] sm:w-[300px] h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 shadow-[0_8px_20px_rgba(4,120,87,0.28)] text-white font-semibold text-base sm:text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Continue"}
                </button>
                <p className="mt-3 text-sm text-emerald-700 flex items-center gap-2 justify-center text-center">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                  </svg>
                  Your information is safe and secure
                </p>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}


