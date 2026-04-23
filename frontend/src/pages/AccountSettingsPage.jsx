import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getApiErrorMessage, getCurrentUser, getUserId, getUserRole, isLoggedIn } from '../lib/api';
import { addLocalNotification } from '../lib/notifications';
import { savePublicProfileSnapshot } from '../lib/publicProfiles';

const INCOME_RANGES = ['BELOW_20K', 'RANGE_20K_40K', 'RANGE_40K_60K', 'RANGE_60K_100K', 'RANGE_100K_200K', 'ABOVE_200K'];
const INCOME_RANGE_LABELS = {
  BELOW_20K: 'Below 20K',
  RANGE_20K_40K: '20K - 40K',
  RANGE_40K_60K: '40K - 60K',
  RANGE_60K_100K: '60K - 100K',
  RANGE_100K_200K: '100K - 200K',
  ABOVE_200K: 'Above 200K',
};
const EMPLOYMENT_STATUSES = ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED'];
const FAMILY_STATUSES = ['FAMILY', 'BACHELOR'];
const OWNER_CATEGORIES = ['RESIDENTIAL', 'COMMERCIAL'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const JOB_CATEGORIES = ['TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'FINANCE', 'CONSTRUCTION', 'HOSPITALITY', 'RETAIL', 'GOVERNMENT', 'SELF_EMPLOYED', 'OTHER'];
const AREA_OPTIONS = ['DHANMONDI', 'GULSHAN', 'BANANI', 'UTTARA', 'MIRPUR', 'MOHAMMADPUR', 'BASHUNDHARA', 'BADDA'];
const RELIGION_OPTIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other'];
const PROFESSION_OPTIONS = ['Software Engineer', 'Doctor', 'Teacher', 'Banker', 'Business', 'Student', 'Government Service', 'Freelancer', 'Other'];
const ENUM_LABELS = {
  BELOW_20K: 'Below 20K',
  RANGE_20K_40K: '20K - 40K',
  RANGE_40K_60K: '40K - 60K',
  RANGE_60K_100K: '60K - 100K',
  RANGE_100K_200K: '100K - 200K',
  ABOVE_200K: 'Above 200K',
  SELF_EMPLOYED: 'Self Employed',
  AUTH_PENDING: 'Auth Pending',
  PROFILE_PENDING: 'Profile Pending',
  UNDER_REVIEW: 'Under Review',
};

function getLocalUserId(user) {
  return getUserId(user);
}

function toLabel(value) {
  if (value == null || value === '') return 'N/A';
  if (ENUM_LABELS[value]) return ENUM_LABELS[value];
  return String(value)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toDateLabel(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    religion: '',
    profession: '',
    jobCategory: '',
    profilePhotoUrl: '',
    currentArea: '',
    incomeRange: '',
    employmentStatus: '',
    familyStatus: '',
    familySize: '',
    ownerCategory: '',
  });

  const [localUser] = useState(() => getCurrentUser());
  const localUserId = getLocalUserId(localUser);
  const role = statusData?.role || getUserRole(localUser);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        if (!isLoggedIn()) {
          window.location.href = '/login';
          return;
        }

        if (!localUserId) {
          throw new Error('User session is missing ID. Please login again.');
        }

        setUser(localUser);

        const statusRes = await apiFetch(`/users/${localUserId}/profile-status`);
        const statusBody = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok) throw new Error(getApiErrorMessage(statusBody, 'Failed to load profile status'));
        setStatusData(statusBody?.data || null);
        const profile = statusBody?.data?.profile || {};
        savePublicProfileSnapshot({
          userId: localUserId,
          name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || localUser?.username || 'User',
          email: statusBody?.data?.contactEmail || localUser?.contactEmail || localUser?.email || '',
          phone: statusBody?.data?.contactPhone || localUser?.contactPhone || '',
          role: statusBody?.data?.role || localUser?.role || '',
          area: profile?.currentArea || '',
          profession: profile?.profession || '',
          verificationStatus: statusBody?.data?.kycVerificationStatus || '',
        });
      } catch (e) {
        setError(e.message || 'Failed to load account settings.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [localUserId, localUser]);

  const onChange = (field, value) => {
    setProfileForm((prev) => {
      if (field === 'familyStatus') {
        const isFamily = value === 'FAMILY';
        return {
          ...prev,
          familyStatus: value,
          familySize: isFamily ? (prev.familySize || '1') : '',
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const isFamilyStatus = profileForm.familyStatus === 'FAMILY';

  const adjustFamilySize = (delta) => {
    if (!isFamilyStatus) return;
    const current = Number(profileForm.familySize) || 1;
    const next = Math.max(1, current + delta);
    setProfileForm((prev) => ({ ...prev, familySize: String(next) }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');

    try {
      if (!localUserId) throw new Error('User ID not found.');

      const payload = {};
      Object.entries(profileForm).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) return;
        if (key === 'familySize') {
          payload[key] = Number(value);
          return;
        }
        payload[key] = value;
      });

      // Explicit role helps backend pick the right validation branch.
      if (role === 'TENANT' || role === 'OWNER') {
        payload.role = role;
      }

      if (Object.keys(payload).length === 0) {
        throw new Error('Fill at least one field to update your profile.');
      }

      const res = await apiFetch(`/users/${localUserId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to update profile'));

      const statusRes = await apiFetch(`/users/${localUserId}/profile-status`);
      const statusBody = await statusRes.json().catch(() => ({}));
      if (statusRes.ok) {
        setStatusData(statusBody?.data || null);
        const profile = statusBody?.data?.profile || {};
        savePublicProfileSnapshot({
          userId: localUserId,
          name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || user?.username || 'User',
          email: statusBody?.data?.contactEmail || user?.contactEmail || user?.email || '',
          phone: statusBody?.data?.contactPhone || user?.contactPhone || '',
          role: statusBody?.data?.role || user?.role || '',
          area: profile?.currentArea || '',
          profession: profile?.profession || '',
          verificationStatus: statusBody?.data?.kycVerificationStatus || '',
        });
      }

      addLocalNotification({
        title: 'Profile Updated',
        message: 'Your account profile details were updated successfully.',
        url: '/account',
        type: 'PROFILE',
      });
      setSuccess(body?.message || 'Profile updated successfully.');
      setProfileForm({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        religion: '',
        profession: '',
        jobCategory: '',
        profilePhotoUrl: '',
        currentArea: '',
        incomeRange: '',
        employmentStatus: '',
        familyStatus: '',
        familySize: '',
        ownerCategory: '',
      });
    } catch (e) {
      setError(e.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const dashboardPath =
    role === 'ADMIN' ? '/admin-dashboard' : role === 'OWNER' ? '/owner-dashboard' : '/tenant-dashboard';

  const profileCompletion = statusData?.profileCompletion;
  const profile = statusData?.profile || {};
  const baseMissing = profileCompletion?.base?.missingFields || [];
  const roleMissing = profileCompletion?.roleSpecific?.missingFields || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <div className="flex items-center gap-4">
            <Link to="/wallet" className="text-teal-700 hover:text-teal-800 text-sm font-semibold">Wallet</Link>
            <Link to={dashboardPath} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <section className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><span className="text-gray-500">Email:</span> {statusData?.contactEmail || user.contactEmail || user.contact_email || user.email || 'N/A'}</p>
            <p><span className="text-gray-500">Phone:</span> {statusData?.contactPhone || user.contactPhone || user.contact_phone || user.contactNumber || user.contact_number || 'N/A'}</p>
            <p><span className="text-gray-500">Role:</span> {role || 'N/A'}</p>
            <p><span className="text-gray-500">Onboarding:</span> {toLabel(statusData?.onboardingStatus)}</p>
            <p><span className="text-gray-500">KYC Status:</span> {toLabel(statusData?.kycVerificationStatus)}</p>
          </div>
          {profileCompletion && (
            <div className="mt-4 text-sm">
              <p className="font-medium text-gray-900">
                Profile completion: {profileCompletion?.overall ? 'Complete' : 'Incomplete'}
              </p>
              {!profileCompletion?.overall && (
                <div className="mt-2 text-gray-600">
                  {baseMissing.length > 0 && <p>Base missing: {baseMissing.join(', ')}</p>}
                  {roleMissing.length > 0 && <p>Role missing: {roleMissing.join(', ')}</p>}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Profile Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><span className="text-gray-500">Full Name:</span> {profile.firstName || profile.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'N/A'}</p>
            <p><span className="text-gray-500">Date of Birth:</span> {toDateLabel(profile.dateOfBirth)}</p>
            <p><span className="text-gray-500">Gender:</span> {toLabel(profile.gender)}</p>
            <p><span className="text-gray-500">Religion:</span> {profile.religion || 'N/A'}</p>
            <p><span className="text-gray-500">Profession:</span> {profile.profession || 'N/A'}</p>
            <p><span className="text-gray-500">Job Category:</span> {toLabel(profile.jobCategory)}</p>
            <p><span className="text-gray-500">Current Area:</span> {profile.currentArea || 'N/A'}</p>
            {role === 'TENANT' && (
              <>
                <p><span className="text-gray-500">Income Range:</span> {toLabel(profile.incomeRange)}</p>
                <p><span className="text-gray-500">Employment Status:</span> {toLabel(profile.employmentStatus)}</p>
                <p><span className="text-gray-500">Family Status:</span> {toLabel(profile.familyStatus)}</p>
                <p><span className="text-gray-500">Family Size:</span> {profile.familySize ?? 'N/A'}</p>
              </>
            )}
            {role === 'OWNER' && (
              <p><span className="text-gray-500">Owner Category:</span> {toLabel(profile.ownerCategory)}</p>
            )}
          </div>
        </section>

        <form onSubmit={saveProfile} className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Update Profile</h2>
          <p className="text-sm text-gray-500">
            Submit only the fields you want to change. Fields left empty are ignored.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="First name" value={profileForm.firstName} onChange={(e) => onChange('firstName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Last name" value={profileForm.lastName} onChange={(e) => onChange('lastName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="date" value={profileForm.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <select value={profileForm.gender} onChange={(e) => onChange('gender', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select gender</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={profileForm.religion} onChange={(e) => onChange('religion', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select religion</option>
              {RELIGION_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={profileForm.profession} onChange={(e) => onChange('profession', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select profession</option>
              {PROFESSION_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={profileForm.jobCategory} onChange={(e) => onChange('jobCategory', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select job category</option>
              {JOB_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input type="url" placeholder="Profile photo URL" value={profileForm.profilePhotoUrl} onChange={(e) => onChange('profilePhotoUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <select value={profileForm.currentArea} onChange={(e) => onChange('currentArea', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg md:col-span-2">
              <option value="">Select current area</option>
              {AREA_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          {role === 'TENANT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <select value={profileForm.incomeRange} onChange={(e) => onChange('incomeRange', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select income range</option>
                {INCOME_RANGES.map((item) => <option key={item} value={item}>{INCOME_RANGE_LABELS[item] || item}</option>)}
              </select>
              <select value={profileForm.employmentStatus} onChange={(e) => onChange('employmentStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select employment status</option>
                {EMPLOYMENT_STATUSES.map((item) => <option key={item} value={item}>{toLabel(item)}</option>)}
              </select>
              <select value={profileForm.familyStatus} onChange={(e) => onChange('familyStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select family status</option>
                {FAMILY_STATUSES.map((item) => <option key={item} value={item}>{toLabel(item)}</option>)}
              </select>
              <div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustFamilySize(-1)}
                    disabled={!isFamilyStatus}
                    className="w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={isFamilyStatus ? (profileForm.familySize || '1') : 'N/A'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                  />
                  <button
                    type="button"
                    onClick={() => adjustFamilySize(1)}
                    disabled={!isFamilyStatus}
                    className="w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                {!isFamilyStatus && <p className="text-xs text-gray-400 mt-1">Family size is N/A unless family status is FAMILY.</p>}
              </div>
            </div>
          )}

          {role === 'OWNER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <select value={profileForm.ownerCategory} onChange={(e) => onChange('ownerCategory', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select owner category</option>
                {OWNER_CATEGORIES.map((item) => <option key={item} value={item}>{toLabel(item)}</option>)}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  );
}
