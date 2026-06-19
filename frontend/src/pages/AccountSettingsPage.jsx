import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiFetch, getApiErrorMessage, getCurrentUser, getUserId, getUserRole, isLoggedIn } from '../lib/api';
import { addLocalNotification } from '../lib/notifications';
import { savePublicProfileSnapshot } from '../lib/publicProfiles';
import { getAcceptValue, isAllowedFileByMimeAndExtension, PROFILE_PHOTO_MIMES } from '../lib/fileValidation';
import { useTranslation } from '../lib/i18n';

const INCOME_RANGES = ['BELOW_20K', 'RANGE_20K_40K', 'RANGE_40K_60K', 'RANGE_60K_100K', 'RANGE_100K_200K', 'ABOVE_200K'];
const EMPLOYMENT_STATUSES = ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED'];
const FAMILY_STATUSES = ['FAMILY', 'BACHELOR'];
const OWNER_CATEGORIES = ['RESIDENTIAL', 'COMMERCIAL'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const JOB_CATEGORIES = ['TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'FINANCE', 'CONSTRUCTION', 'HOSPITALITY', 'RETAIL', 'GOVERNMENT', 'SELF_EMPLOYED', 'OTHER'];
const AREA_OPTIONS = ['DHANMONDI', 'GULSHAN', 'BANANI', 'UTTARA', 'MIRPUR', 'MOHAMMADPUR', 'BASHUNDHARA', 'BADDA'];
const RELIGION_OPTIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other'];
const PROFESSION_OPTIONS = ['Software Engineer', 'Doctor', 'Teacher', 'Banker', 'Business', 'Student', 'Government Service', 'Freelancer', 'Other'];

const RELIGION_VALUE_TO_KEY = {
  Islam: 'ISLAM',
  Hinduism: 'HINDUISM',
  Christianity: 'CHRISTIANITY',
  Buddhism: 'BUDDHISM',
  Other: 'OTHER',
};

function translateEnum(value, t) {
  if (value == null || value === '') return t('common.na');

  const groups = ['incomeRange', 'employment', 'familyStatus', 'ownerCategory', 'gender', 'jobCategory'];
  for (const group of groups) {
    const key = `common.enums.${group}.${value}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }

  const areaKey = `common.areas.${value}`;
  const areaTranslated = t(areaKey);
  if (areaTranslated !== areaKey) return areaTranslated;

  const religionKey = RELIGION_VALUE_TO_KEY[value];
  if (religionKey) {
    const relKey = `common.enums.religion.${religionKey}`;
    const relTranslated = t(relKey);
    if (relTranslated !== relKey) return relTranslated;
  }

  const kycKey = `common.enums.kyc.${value}`;
  const kycTranslated = t(kycKey);
  if (kycTranslated !== kycKey) return kycTranslated;

  return String(value)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toLabel(value, t) {
  return translateEnum(value, t);
}

function toDateLabel(value, t) {
  if (!value) return t('common.na');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

function getLocalUserId(user) {
  return getUserId(user);
}

function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

const EMPTY_PROFILE_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  religion: '',
  profession: '',
  jobCategory: '',
  profilePhotoKey: '',
  currentArea: '',
  incomeRange: '',
  employmentStatus: '',
  familyStatus: '',
  familySize: '',
  ownerCategory: '',
};

function buildProfileFormFromDetails(profile = {}) {
  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    gender: profile.gender || '',
    religion: profile.religion || '',
    profession: profile.profession || '',
    jobCategory: profile.jobCategory || '',
    profilePhotoKey: profile.profilePhotoKey || '',
    currentArea: profile.currentArea || '',
    incomeRange: profile.incomeRange || '',
    employmentStatus: profile.employmentStatus || '',
    familyStatus: profile.familyStatus || '',
    familySize:
      profile.familySize != null && profile.familySize !== ''
        ? String(profile.familySize)
        : '',
    ownerCategory: profile.ownerCategory || '',
  };
}

export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [user, setUser] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileForm, setProfileForm] = useState({ ...EMPTY_PROFILE_FORM });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const profilePhotoInputRef = useRef(null);

  const [localUser] = useState(() => getCurrentUser());
  const localUserId = getLocalUserId(localUser);
  const role = statusData?.role || getUserRole(localUser);

  const loadProfilePhotoUrl = async (profileKey) => {
    if (!profileKey || !localUserId) {
      setProfilePhotoUrl('');
      return;
    }

    const res = await apiFetch(`/users/${localUserId}/profile-photo/download-url`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setProfilePhotoUrl('');
      return;
    }

    setProfilePhotoUrl(body?.data?.downloadUrl || '');
  };

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
          throw new Error(t('account.errors.sessionMissing'));
        }

        setUser(localUser);

        const statusRes = await apiFetch(`/users/${localUserId}/profile-status`);
        const statusBody = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok) throw new Error(getApiErrorMessage(statusBody, t('account.errors.updateFailed')));
        setStatusData(statusBody?.data || null);
        const profile = statusBody?.data?.profile || {};
        setProfileForm(buildProfileFormFromDetails(profile));
        await loadProfilePhotoUrl(profile?.profilePhotoKey);
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
        setError(e.message || t('account.errors.updateFailed'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [localUserId, localUser, t]);

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

  const startEditingProfile = () => {
    const profile = statusData?.profile || {};
    setProfileForm(buildProfileFormFromDetails(profile));
    setProfilePhotoFile(null);
    setProfilePhotoPreview('');
    setError('');
    setSuccess('');
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    const profile = statusData?.profile || {};
    setProfileForm(buildProfileFormFromDetails(profile));
    setProfilePhotoFile(null);
    setProfilePhotoPreview('');
    setError('');
    setIsEditingProfile(false);
  };

  const fieldClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed';

  const adjustFamilySize = (delta) => {
    if (!isFamilyStatus) return;
    const current = Number(profileForm.familySize) || 1;
    const next = Math.max(1, current + delta);
    setProfileForm((prev) => ({ ...prev, familySize: String(next) }));
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('account.errors.photoTooLarge'));
      return;
    }

    if (!isAllowedFileByMimeAndExtension(file, PROFILE_PHOTO_MIMES)) {
      setError(t('account.errors.photoFormat'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setProfilePhotoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
    setProfilePhotoFile(file);
    setError('');
  };

  const uploadProfilePhoto = async (file) => {
    if (!localUserId) throw new Error(t('account.errors.userIdNotFound'));

    const uploadRes = await apiFetch(`/users/${localUserId}/profile-photo/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
      }),
    });
    const uploadBody = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(getApiErrorMessage(uploadBody, 'Failed to prepare profile photo upload'));

    const { uploadUrl, fileKey } = uploadBody?.data || {};
    if (!uploadUrl || !fileKey) throw new Error('Invalid profile photo upload response.');

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!putRes.ok) throw new Error('Failed to upload profile photo.');

    const res = await apiFetch(`/users/${localUserId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profilePhotoKey: fileKey,
        ...(role === 'TENANT' || role === 'OWNER' ? { role } : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to update profile photo'));

    const statusRes = await apiFetch(`/users/${localUserId}/profile-status`);
    const statusBody = await statusRes.json().catch(() => ({}));
    if (statusRes.ok) {
      setStatusData(statusBody?.data || null);
      const updatedProfile = statusBody?.data?.profile || {};
      setProfileForm(buildProfileFormFromDetails(updatedProfile));
      await loadProfilePhotoUrl(updatedProfile?.profilePhotoKey);
    }

    return body?.message || t('account.toast.photoUpdated');
  };

  const handleProfilePhotoOnlyChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('account.errors.photoTooLarge'));
      return;
    }

    if (!isAllowedFileByMimeAndExtension(file, PROFILE_PHOTO_MIMES)) {
      setError(t('account.errors.photoFormat'));
      return;
    }

    setSavingPhoto(true);
    setError('');
    setSuccess('');

    try {
      const message = await uploadProfilePhoto(file);
      addLocalNotification({
        title: t('account.notification.photoUpdatedTitle'),
        message: t('account.toast.photoUpdated'),
        url: '/account',
        type: 'PROFILE',
      });
      setSuccess(message);
    } catch (err) {
      setError(err?.message || t('account.errors.updateFailed'));
    } finally {
      setSavingPhoto(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');

    try {
      if (!localUserId) throw new Error(t('account.errors.userIdNotFound'));

      const payload = {};
      Object.entries(profileForm).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) return;
        if (key === 'familySize') {
          payload[key] = Number(value);
          return;
        }
        payload[key] = value;
      });

      if (profilePhotoFile) {
        const uploadRes = await apiFetch(`/users/${localUserId}/profile-photo/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: profilePhotoFile.name,
            mimeType: profilePhotoFile.type,
          }),
        });
        const uploadBody = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(getApiErrorMessage(uploadBody, 'Failed to prepare profile photo upload'));

        const { uploadUrl, fileKey } = uploadBody?.data || {};
        if (!uploadUrl || !fileKey) throw new Error('Invalid profile photo upload response.');

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': profilePhotoFile.type },
          body: profilePhotoFile,
        });
        if (!putRes.ok) throw new Error('Failed to upload profile photo.');

        payload.profilePhotoKey = fileKey;
      }

      // Explicit role helps backend pick the right validation branch.
      if (role === 'TENANT' || role === 'OWNER') {
        payload.role = role;
      }

      if (Object.keys(payload).length === 0) {
        throw new Error(t('account.errors.fillOneField'));
      }

      const res = await apiFetch(`/users/${localUserId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, t('account.errors.updateFailed')));

      const statusRes = await apiFetch(`/users/${localUserId}/profile-status`);
      const statusBody = await statusRes.json().catch(() => ({}));
      if (statusRes.ok) {
        setStatusData(statusBody?.data || null);
        const profile = statusBody?.data?.profile || {};
        setProfileForm(buildProfileFormFromDetails(profile));
        await loadProfilePhotoUrl(profile?.profilePhotoKey);
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
        title: t('account.notification.profileUpdatedTitle'),
        message: t('account.toast.profileUpdated'),
        url: '/account',
        type: 'PROFILE',
      });
      setSuccess(body?.message || t('account.toast.profileUpdated'));
      setProfilePhotoFile(null);
      setProfilePhotoPreview('');
      setIsEditingProfile(false);
    } catch (e) {
      setError(e.message || t('account.errors.updateFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('account.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const dashboardPath =
    role === 'ADMIN' ? '/admin-dashboard' : role === 'OWNER' ? '/owner-dashboard' : '/tenant-dashboard';

  const profile = statusData?.profile || {};

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl lg:text-3xl">
            {t('account.title')}
          </h1>
          <Link
            to={dashboardPath}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:self-auto"
          >
            <span aria-hidden>&larr;</span> {t('account.backToDashboard')}
          </Link>
        </div>
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('account.profileDetails.title')}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-10 lg:gap-x-14 md:items-start">
            <div className="mx-auto flex w-full max-w-[12rem] flex-col items-center text-center md:mx-0">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={t('account.photo.alt')}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-2 text-center text-xs text-gray-400">{t('account.photo.noPhoto')}</span>
                )}
              </div>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept={getAcceptValue(PROFILE_PHOTO_MIMES)}
                className="hidden"
                onChange={handleProfilePhotoOnlyChange}
              />
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={savingPhoto}
                className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold leading-snug text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPhoto ? t('account.photo.uploading') : t('account.photo.updateButton')}
              </button>
            </div>

            <div className="space-y-3 text-sm md:pl-2 lg:pl-4">
              <p><span className="text-gray-500">{t('account.fields.email')}</span> {statusData?.contactEmail || user.contactEmail || user.contact_email || user.email || t('common.na')}</p>
              <p><span className="text-gray-500">{t('account.fields.fullName')}</span> {profile.firstName || profile.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : t('common.na')}</p>
              <p><span className="text-gray-500">{t('account.fields.gender')}</span> {toLabel(profile.gender, t)}</p>
              <p><span className="text-gray-500">{t('account.fields.profession')}</span> {profile.profession || t('common.na')}</p>
              <p><span className="text-gray-500">{t('account.fields.currentArea')}</span> {profile.currentArea ? toLabel(profile.currentArea, t) : t('common.na')}</p>
              {role === 'TENANT' && (
                <>
                  <p><span className="text-gray-500">{t('account.fields.incomeRange')}</span> {toLabel(profile.incomeRange, t)}</p>
                  <p><span className="text-gray-500">{t('account.fields.employmentStatus')}</span> {toLabel(profile.employmentStatus, t)}</p>
                </>
              )}
            </div>

            <div className="space-y-3 text-sm md:pl-2 lg:pl-4">
              <p><span className="text-gray-500">{t('account.fields.phone')}</span> {statusData?.contactPhone || user.contactPhone || user.contact_phone || user.contactNumber || user.contact_number || t('common.na')}</p>
              <p><span className="text-gray-500">{t('account.fields.dateOfBirth')}</span> {toDateLabel(profile.dateOfBirth, t)}</p>
              <p><span className="text-gray-500">{t('account.fields.religion')}</span> {profile.religion ? toLabel(profile.religion, t) : t('common.na')}</p>
              <p><span className="text-gray-500">{t('account.fields.jobCategory')}</span> {toLabel(profile.jobCategory, t)}</p>
              {role === 'OWNER' && (
                <p><span className="text-gray-500">{t('account.fields.ownerCategory')}</span> {toLabel(profile.ownerCategory, t)}</p>
              )}
              {role === 'TENANT' && (
                <>
                  <p><span className="text-gray-500">{t('account.fields.familyStatus')}</span> {toLabel(profile.familyStatus, t)}</p>
                  <p><span className="text-gray-500">{t('account.fields.familySize')}</span> {profile.familySize ?? t('common.na')}</p>
                </>
              )}
            </div>
          </div>
        </section>

        {!isEditingProfile ? (
          <button
            type="button"
            onClick={startEditingProfile}
            className="mb-8 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            {t('account.editProfile')}
          </button>
        ) : (
        <form onSubmit={saveProfile} className="bg-white shadow rounded-lg p-6 space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900">{t('account.updateForm.title')}</h2>
          <p className="text-sm text-gray-500">
            {t('account.updateForm.subtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder={t('account.placeholders.firstName')} value={profileForm.firstName} onChange={(e) => onChange('firstName', e.target.value)} className={fieldClass} />
            <input type="text" placeholder={t('account.placeholders.lastName')} value={profileForm.lastName} onChange={(e) => onChange('lastName', e.target.value)} className={fieldClass} />
            <input type="date" value={profileForm.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} className={fieldClass} />
            <select value={profileForm.gender} onChange={(e) => onChange('gender', e.target.value)} className={fieldClass}>
              <option value="">{t('account.placeholders.selectGender')}</option>
              {GENDERS.map((g) => <option key={g} value={g}>{toLabel(g, t)}</option>)}
            </select>
            <select value={profileForm.religion} onChange={(e) => onChange('religion', e.target.value)} className={fieldClass}>
              <option value="">{t('account.placeholders.selectReligion')}</option>
              {RELIGION_OPTIONS.map((item) => <option key={item} value={item}>{toLabel(item, t)}</option>)}
            </select>
            <select value={profileForm.profession} onChange={(e) => onChange('profession', e.target.value)} className={fieldClass}>
              <option value="">{t('account.placeholders.selectProfession')}</option>
              {PROFESSION_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={profileForm.jobCategory} onChange={(e) => onChange('jobCategory', e.target.value)} className={fieldClass}>
              <option value="">{t('account.placeholders.selectJobCategory')}</option>
              {JOB_CATEGORIES.map((item) => <option key={item} value={item}>{toLabel(item, t)}</option>)}
            </select>
            <div className="md:col-span-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-20 w-20 rounded-full border border-gray-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                  {profilePhotoPreview || profilePhotoUrl ? (
                    <img
                      src={profilePhotoPreview || profilePhotoUrl}
                      alt={t('account.photo.alt')}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 text-center px-2">{t('account.photoForm.none')}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{t('account.photoForm.title')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('account.photoForm.hint')}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer transition">
                      <input
                        type="file"
                        accept={getAcceptValue(PROFILE_PHOTO_MIMES)}
                        className="hidden"
                        onChange={handleProfilePhotoChange}
                      />
                      {t('account.photoForm.choose')}
                    </label>
                    {profilePhotoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePhotoFile(null);
                          setProfilePhotoPreview('');
                        }}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                      >
                        {t('account.photoForm.remove')}
                      </button>
                    )}
                  </div>
                  {profilePhotoFile && (
                    <p className="mt-2 text-xs text-gray-500 break-all">{t('account.photoForm.selected', { name: profilePhotoFile.name })}</p>
                  )}
                </div>
              </div>
            </div>
            <select value={profileForm.currentArea} onChange={(e) => onChange('currentArea', e.target.value)} className={`${fieldClass} md:col-span-2`}>
              <option value="">{t('account.placeholders.selectArea')}</option>
              {AREA_OPTIONS.map((item) => <option key={item} value={item}>{toLabel(item, t)}</option>)}
            </select>
          </div>

          {role === 'TENANT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <select value={profileForm.incomeRange} onChange={(e) => onChange('incomeRange', e.target.value)} className={fieldClass}>
                <option value="">{t('account.placeholders.selectIncomeRange')}</option>
                {INCOME_RANGES.map((item) => <option key={item} value={item}>{toLabel(item, t)}</option>)}
              </select>
              <select value={profileForm.employmentStatus} onChange={(e) => onChange('employmentStatus', e.target.value)} className={fieldClass}>
                <option value="">{t('account.placeholders.selectEmployment')}</option>
                {EMPLOYMENT_STATUSES.map((item) => <option key={item} value={item}>{toLabel(item, t)}</option>)}
              </select>
              <select value={profileForm.familyStatus} onChange={(e) => onChange('familyStatus', e.target.value)} className={fieldClass}>
                <option value="">{t('account.placeholders.selectFamilyStatus')}</option>
                {FAMILY_STATUSES.map((item) => <option key={item} value={item}>{toLabel(item, t)}</option>)}
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
                    value={isFamilyStatus ? (profileForm.familySize || '1') : t('common.na')}
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
                {!isFamilyStatus && <p className="text-xs text-gray-400 mt-1">{t('account.familySizeHint')}</p>}
              </div>
            </div>
          )}

          {role === 'OWNER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <select value={profileForm.ownerCategory} onChange={(e) => onChange('ownerCategory', e.target.value)} className={fieldClass}>
                <option value="">{t('account.placeholders.selectOwnerCategory')}</option>
                {OWNER_CATEGORIES.map((item) => <option key={item} value={item}>{toLabel(item, t)}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {savingProfile ? t('account.actions.updating') : t('account.actions.updateProfile')}
            </button>
            <button
              type="button"
              onClick={cancelEditingProfile}
              disabled={savingProfile}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {t('account.actions.cancel')}
            </button>
          </div>
        </form>
        )}
      </main>
    </div>
  );
}

