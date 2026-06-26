import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  apiFetch,
  getApiErrorMessage,
  getCurrentUser,
  getRequestErrorMessage,
  getUserId,
  isLoggedIn,
  isOwnerProfileMissingError,
  logout,
} from '../lib/api';
import { listOwnerIncomingRequests, reviewOwnerRequest } from '../lib/requests';
import { addLocalNotification } from '../lib/notifications';
import { savePublicProfileSnapshot } from '../lib/publicProfiles';
import AppHeader from '../components/AppHeader';
import { getOwnerSidebarNavItems } from '../lib/nav/ownerSidebarNav';
import { useTranslation } from '../lib/i18n';

function Icon({ path, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

function formatBdt(n) {
  if (n == null || Number.isNaN(Number(n))) return '-';
  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(Number(n));
  } catch {
    return `${Number(n).toLocaleString()} BDT`;
  }
}

function formatRelativeTime(iso, t) {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const diff = Date.now() - time;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('common.time.justNow');
  if (m < 60) return t('common.time.minutesAgo', { m });
  const h = Math.floor(m / 60);
  if (h < 48) return t(h === 1 ? 'common.time.hoursAgo' : 'common.time.hoursAgo_other', { h });
  const d = Math.floor(h / 24);
  return t(d === 1 ? 'common.time.daysAgo' : 'common.time.daysAgo_other', { d });
}

function displayName(user) {
  const fn = user?.profile?.firstName;
  const ln = user?.profile?.lastName;
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  if (full) return full;
  return user?.username || user?.contactEmail || user?.contact_email || user?.email || 'there';
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function getImageSrc(image) {
  return (
    image?.url ||
    image?.storagePath ||
    image?.storage_path ||
    image?.filePath ||
    image?.file_path ||
    ''
  );
}

function primaryListing(property) {
  const listings = property.listings || [];
  return (
    listings.find((l) => l.listingStatus === 'ACTIVE') ||
    listings.find((l) => l.listingStatus === 'UNLISTED') ||
    listings[0] ||
    null
  );
}

/** Listing the owner can pause (hide from public feed). */
function listingToPause(property) {
  const listings = property.listings || [];
  return (
    listings.find((l) => l.listingStatus === 'ACTIVE' || l.listingStatus === 'PENDING_PAYMENT') || null
  );
}

function listingToResume(property) {
  const listings = property.listings || [];
  return listings.find((l) => l.listingStatus === 'UNLISTED') || null;
}

function getKycProgress(status, t) {
  const key = String(status || '').toUpperCase();
  if (key === 'APPROVED' || key === 'ACCEPTED') {
    return {
      label: t('dashboard.owner.kyc.verified'),
      width: 'w-full',
      bar: 'bg-emerald-600',
      track: 'bg-emerald-100',
      hint: t('dashboard.owner.kyc.verifiedHint'),
    };
  }
  if (key === 'SUBMITTED' || key === 'UNDER_REVIEW') {
    return {
      label: t('dashboard.owner.kyc.underReview'),
      width: 'w-2/3',
      bar: 'bg-amber-500',
      track: 'bg-amber-100',
      hint: t('dashboard.owner.kyc.underReviewHint'),
    };
  }
  if (key === 'REJECTED') {
    return {
      label: t('dashboard.owner.kyc.rejected'),
      width: 'w-1/3',
      bar: 'bg-red-500',
      track: 'bg-red-100',
      hint: t('dashboard.owner.kyc.rejectedHint'),
    };
  }
  return {
    label: t('dashboard.owner.kyc.pending'),
    width: 'w-1/3',
    bar: 'bg-amber-500',
    track: 'bg-amber-100',
    hint: t('dashboard.owner.kyc.pendingHint'),
  };
}

function SidebarLink({ to, label, iconPath, active, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        active
          ? 'bg-emerald-100 text-emerald-800 font-medium'
          : 'text-gray-700 hover:bg-emerald-50/80'
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
          active
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-white text-gray-500'
        }`}
      >
        <Icon className="h-4 w-4" path={iconPath} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function OwnerDashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [reviewingId, setReviewingId] = useState(null);
  /** `d:propertyId` | `p:propertyId:listingId` | `r:propertyId:listingId` */
  const [propertyBusyKey, setPropertyBusyKey] = useState(null);
  const [dashError, setDashError] = useState('');

  const loadOwnerListingIds = useCallback(async () => {
    try {
      const propertyRes = await apiFetch('/properties/me');
      const propertyBody = await propertyRes.json().catch(() => ({}));
      if (!propertyRes.ok) return [];
      const items = propertyBody?.data?.items || [];
      const listingSets = await Promise.all(
        items.map(async (property) => {
          const res = await apiFetch(`/properties/${property.propertyId}/listings`);
          const body = await res.json().catch(() => ({}));
          if (!res.ok) return [];
          return (body?.data?.items || []).map((item) => String(item.listingId));
        })
      );
      return listingSets.flat();
    } catch {
      return [];
    }
  }, []);

  const loadProperties = useCallback(async () => {
    const res = await apiFetch('/properties/me');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, t('common.unexpectedError')));
    const items = body?.data?.items || [];
    const withListings = await Promise.all(
      items.map(async (property) => {
        try {
          const listingRes = await apiFetch(`/properties/${property.propertyId}/listings`);
          const listingBody = await listingRes.json().catch(() => ({}));
          const listings = listingRes.ok ? listingBody?.data?.items || [] : [];
          const imageRes = await apiFetch(`/properties/${property.propertyId}/images`);
          const imageBody = await imageRes.json().catch(() => ({}));
          const images = imageRes.ok ? imageBody?.data?.items || [] : [];
          const primaryImage = images.find((img) => img?.isPrimary) || images[0] || null;
          return { ...property, listings, images, primaryImage };
        } catch {
          return { ...property, listings: [], images: [], primaryImage: null };
        }
      })
    );
    return withListings;
  }, [t]);

  const loadIncoming = useCallback(async () => {
    const ids = await loadOwnerListingIds();
    const state = await listOwnerIncomingRequests(ids);
    const items = state.items || [];
    items.forEach((item) => {
      if (item?.tenant?.userId) {
        savePublicProfileSnapshot({
          userId: item.tenant.userId,
          name: item.tenant.name,
          email: item.tenant.email,
          phone: item.tenant.phone,
          role: 'TENANT',
        });
      }
    });
    setIncoming(items);
  }, [loadOwnerListingIds]);

  const loadTransactions = useCallback(async () => {
    const res = await apiFetch('/wallet/transactions?page=1&limit=5');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return body?.data?.transactions || [];
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      await loadIncoming();
      setTransactions(await loadTransactions());
      setProperties(await loadProperties());
    } catch (e) {
      console.error(e);
      const message = getRequestErrorMessage(e, t('dashboard.owner.errors.refreshFailed'));
      setDashError(message);
      toast.error(message);
    }
  }, [loadIncoming, loadProperties, loadTransactions, t]);

  const patchListingStatus = useCallback(async (propertyId, listingId, listingStatus) => {
    const res = await apiFetch(`/properties/${propertyId}/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingStatus }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, t('common.unexpectedError')));
  }, [t]);

  const handleDeleteProperty = useCallback(
    async (propertyId) => {
      const ok = window.confirm(t('dashboard.owner.confirm.deleteProperty'));
      if (!ok) return;
      setPropertyBusyKey(`d:${propertyId}`);
      try {
        const res = await apiFetch(`/properties/${propertyId}`, { method: 'DELETE' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(getApiErrorMessage(body, t('dashboard.owner.toast.deleteFailed')));
        toast.success(t('dashboard.owner.toast.propertyDeleted'));
        await refreshDashboard();
      } catch (e) {
        toast.error(e?.message || t('dashboard.owner.toast.deleteFailed'));
      } finally {
        setPropertyBusyKey(null);
      }
    },
    [refreshDashboard, t]
  );

  const handlePauseListing = useCallback(
    async (propertyId, listingId) => {
      setPropertyBusyKey(`p:${propertyId}:${listingId}`);
      try {
        await patchListingStatus(propertyId, listingId, 'UNLISTED');
        toast.success(t('dashboard.owner.toast.listingPaused'));
        await refreshDashboard();
      } catch (e) {
        toast.error(e?.message || t('dashboard.owner.toast.pauseFailed'));
      } finally {
        setPropertyBusyKey(null);
      }
    },
    [patchListingStatus, refreshDashboard, t]
  );

  const handleResumeListing = useCallback(
    async (propertyId, listingId) => {
      setPropertyBusyKey(`r:${propertyId}:${listingId}`);
      try {
        await patchListingStatus(propertyId, listingId, 'ACTIVE');
        toast.success(t('dashboard.owner.toast.listingActive'));
        await refreshDashboard();
      } catch (e) {
        toast.error(e?.message || t('dashboard.owner.toast.resumeFailed'));
      } finally {
        setPropertyBusyKey(null);
      }
    },
    [patchListingStatus, refreshDashboard, t]
  );

  useEffect(() => {
    const run = async () => {
      if (!isLoggedIn()) {
        window.location.href = '/login';
        return;
      }
      setDashLoading(true);
      setDashError('');
      try {
        const stored = getCurrentUser();
        if (stored) setUser(stored);
        const localUserId = getUserId(stored) || stored?.user_id || stored?.id;
        if (localUserId) {
          const res = await apiFetch(`/users/${localUserId}/profile-status`);
          if (res.ok) {
            const body = await res.json().catch(() => ({}));
            const profile = body?.data || {};
            setUser((prev) => ({
              ...prev,
              role: profile.role || prev?.role,
              onboardingStatus: profile.onboardingStatus || prev?.onboardingStatus,
              kycVerificationStatus: profile.kycVerificationStatus || prev?.kycVerificationStatus,
              contactEmail: profile.contactEmail || prev?.contactEmail,
              contactPhone: profile.contactPhone || prev?.contactPhone,
              profile: profile.profile || prev?.profile,
            }));
          }
        }
        const [props, txns] = await Promise.all([loadProperties(), loadTransactions()]);
        setProperties(props);
        setTransactions(txns);
        await loadIncoming();
      } catch (err) {
        console.error(err);
        const message = getRequestErrorMessage(err, t('dashboard.owner.errors.loadFailed'));
        setDashError(message);
        toast.error(message);
      } finally {
        setDashLoading(false);
      }
    };
    void run();
  }, [loadIncoming, loadProperties, loadTransactions, t]);

  const activeListingsCount = useMemo(
    () =>
      properties.reduce(
        (acc, p) => acc + (p.listings || []).filter((l) => l.listingStatus === 'ACTIVE').length,
        0
      ),
    [properties]
  );

  const pendingRequests = useMemo(
    () => incoming.filter((r) => r.requestStatus === 'PENDING'),
    [incoming]
  );

  const filteredProperties = useMemo(() => {
    if (propertyFilter === 'ALL') return properties;
    return properties.filter((p) => (p.listings || []).some((l) => l.listingStatus === 'ACTIVE'));
  }, [properties, propertyFilter]);

  const previewProperties = useMemo(() => filteredProperties.slice(0, 4), [filteredProperties]);

  /** Properties with no live (ACTIVE) listing - paused, draft-only, or no listing yet. */
  const inactivePropertiesAll = useMemo(() => {
    return properties.filter((p) => {
      const listings = p.listings || [];
      if (listings.length === 0) return true;
      return !listings.some((l) => l.listingStatus === 'ACTIVE');
    });
  }, [properties]);

  const welcomeName = displayName(user);

  const pathActive = (prefix, exact) => {
    if (exact) return location.pathname === prefix;
    return location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);
  };

  const filterOptions = useMemo(
    () => [
      { value: 'ALL', label: t('dashboard.owner.properties.filterAll') },
      { value: 'ACTIVE', label: t('dashboard.owner.properties.filterActive') },
    ],
    [t]
  );

  const sideLinks = useMemo(() => getOwnerSidebarNavItems(t), [t]);

  const handleReview = useCallback(async (item, decision) => {
    setReviewingId(item.requestId);
    try {
      const result = await reviewOwnerRequest(item.requestId, decision);
      if (!result.ok) {
        toast.error(decision === 'ACCEPT' ? t('dashboard.owner.toast.approveFailed') : t('dashboard.owner.toast.rejectFailed'));
        return;
      }
      addLocalNotification({
        title: decision === 'ACCEPT' ? t('dashboard.owner.notification.requestApproved') : t('dashboard.owner.notification.requestRejected'),
        message: t('dashboard.owner.notification.requestReviewed', { id: item.listingId, tenant: item.tenant?.name || t('roles.tenant') }),
        url: '/owner-dashboard/requests',
        type: 'REQUEST',
      });
      toast.success(decision === 'ACCEPT' ? t('dashboard.owner.toast.requestApproved') : t('dashboard.owner.toast.requestRejected'));
      await refreshDashboard();
    } finally {
      setReviewingId(null);
    }
  }, [refreshDashboard, t]);

  if (dashLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f3]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-700" />
          <p className="text-sm font-medium text-gray-600">{t('dashboard.owner.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-gray-800">
      <AppHeader variant="wide" />

      <div className="mx-auto w-full max-w-[1500px] lg:flex">
        <aside className="hidden lg:block lg:w-72 lg:max-w-none lg:shrink-0 border-r border-emerald-100 bg-[#f4f8f5]">
          <div className="flex min-h-0 flex-col">
            <nav className="p-4 space-y-1.5" aria-label="Owner sidebar">
              {sideLinks.map((item) => (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  iconPath={item.icon}
                  active={pathActive(item.to, item.exact)}
                />
              ))}
            </nav>
          </div>

          <div className="px-4 pb-5">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full rounded-xl bg-red-50 text-red-600 border border-red-100 py-2.5 text-sm font-semibold hover:bg-red-100 transition"
            >
              {t('header.logout')}
            </button>
            {(() => {
              const kyc = getKycProgress(user?.kycVerificationStatus, t);
              return (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t('dashboard.profileStatus.title')}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{kyc.label}</p>
                  <div className={`mt-3 h-2 rounded-full ${kyc.track}`} aria-hidden>
                    <div
                      className={`h-2 rounded-full ${kyc.bar} ${kyc.width} transition-[width] duration-500`}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{kyc.hint}</p>
                </div>
              );
            })()}
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-7">
            {dashError ? (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <p className="font-medium">{dashError}</p>
                {isOwnerProfileMissingError(dashError) ? (
                  <p className="mt-2 text-red-700">
                    <Link to="/owner-registration" className="font-semibold underline hover:text-red-900">
                      {t('dashboard.owner.errors.completeRegistration')}
                    </Link>{' '}
                    {t('dashboard.owner.errors.completeRegistrationHint')}
                  </p>
                ) : null}
              </div>
            ) : null}
            <section className="mb-5 rounded-2xl border border-emerald-100/80 bg-white p-4 shadow-sm sm:p-6 lg:mb-6">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {t('dashboard.owner.welcome', { name: welcomeName })}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-gray-600">
                {t('dashboard.owner.subtitle')}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100/90 bg-emerald-50/40 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                    <Icon className="h-5 w-5" path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{activeListingsCount}</p>
                    <p className="text-xs font-medium text-gray-600">{t('dashboard.owner.stats.listingsActive')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-amber-100/90 bg-amber-50/35 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-700 shadow-sm ring-1 ring-amber-100">
                    <Icon className="h-5 w-5" path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                    <p className="text-xs font-medium text-gray-600">{t('dashboard.owner.stats.pendingRequests')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                    <Icon className="h-5 w-5" path="M10 5H8v14h2V5zm6 0h-2v14h2V5z" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{inactivePropertiesAll.length}</p>
                    <p className="text-xs font-medium text-gray-600">{t('dashboard.owner.stats.inactiveProperties')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* lg+: properties cols 1-7; requests row 1 + payments row 2 in cols 8-12 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-5 lg:gap-x-6">
              <section className="flex min-h-0 flex-col rounded-2xl border border-emerald-100/80 bg-white shadow-sm lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <div className="border-b border-slate-100/90 bg-gradient-to-r from-slate-50/50 to-white px-4 pb-4 pt-4 sm:p-5">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">{t('dashboard.owner.properties.title')}</h2>

                    <div className="flex w-full items-center justify-center gap-2 pt-1 flex-nowrap">
                      <label className="relative w-[7.75rem] shrink-0 sm:w-[8.5rem]">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h18M6 12h12m-9 7h6" />
                          </svg>
                        </span>
                        <select
                          value={propertyFilter}
                          onChange={(e) => setPropertyFilter(e.target.value)}
                          className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-xs font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 sm:h-11 sm:pl-9 sm:pr-10 sm:text-sm sm:font-medium"
                          aria-label={t('dashboard.owner.properties.filterAria')}
                        >
                          {filterOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 sm:right-3" aria-hidden>
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.174l3.71-3.944a.75.75 0 111.08 1.04l-4.25 4.52a.75.75 0 01-1.08 0l-4.25-4.52a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </label>
                      <Link
                        to="/owner-dashboard/my-properties"
                        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100/70 hover:text-emerald-900 sm:px-3 sm:text-sm"
                      >
                        {t('common.viewAll')}
                      </Link>
                      <Link
                        to="/owner-dashboard/create-listing"
                        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
                      >
                        {t('dashboard.owner.properties.listProperty')}
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4 lg:px-5 lg:pb-6">
                  {previewProperties.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-12 text-center text-sm text-slate-500">
                      {t('dashboard.owner.properties.empty')}{' '}
                      <Link to="/owner-dashboard/create-listing" className="font-semibold text-emerald-700 hover:underline">
                        {t('dashboard.owner.properties.createListing')}
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-3 sm:space-y-4">
                      {previewProperties.map((property) => {
                        const src = getImageSrc(property.primaryImage);
                        const listing = primaryListing(property);
                        const toPause = listingToPause(property);
                        const toResume = listingToResume(property);
                        const rentLabel = listing ? formatBdt(listing.rent) : null;
                        const isActivePublic = listing?.listingStatus === 'ACTIVE';
                        const viewTo = isActivePublic
                          ? `/listings/${listing.listingId}`
                          : `/owner-dashboard/my-properties/${property.propertyId}/edit`;
                        const rowBusy =
                          propertyBusyKey === `d:${property.propertyId}` ||
                          (toPause && propertyBusyKey === `p:${property.propertyId}:${toPause.listingId}`) ||
                          (toResume && propertyBusyKey === `r:${property.propertyId}:${toResume.listingId}`);
                        return (
                          <li
                            key={property.propertyId}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-emerald-200/60 hover:shadow-md hover:ring-emerald-500/[0.08]"
                          >
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-teal-500/0 opacity-0 transition group-hover:opacity-100" />
                            <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5 sm:flex-row sm:items-stretch sm:gap-5 sm:p-4">
                              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80 sm:h-auto sm:w-40 sm:min-h-[7.75rem]">
                                {src ? (
                                  <img
                                    src={src}
                                    alt={property.title || 'Property'}
                                    className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                                    {t('common.noPhotoYet')}
                                  </div>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3.5">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                                      {property.title || t('common.untitledProperty')}
                                    </h3>
                                    {listing ? (
                                      <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                          listing.listingStatus === 'ACTIVE'
                                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
                                            : listing.listingStatus === 'UNLISTED'
                                              ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-100'
                                              : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
                                        }`}
                                      >
                                        {listing.listingStatus === 'UNLISTED' ? t('common.status.listing.paused') : t(`common.status.listing.${listing.listingStatus}`, listing.listingStatus)}
                                      </span>
                                    ) : null}
                                  </div>
                                  {rentLabel ? (
                                    <p className="mt-1.5 text-lg font-bold tabular-nums tracking-tight text-emerald-700">
                                      {rentLabel}
                                      <span className="text-sm font-semibold text-slate-500">{t('common.perMonth')}</span>
                                    </p>
                                  ) : (
                                    <p className="mt-1.5 text-sm font-medium text-slate-400">{t('dashboard.owner.properties.noListingYet')}</p>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/90 p-2 ring-1 ring-slate-100 sm:flex sm:flex-wrap sm:justify-end sm:gap-2 sm:p-1.5 md:grid md:grid-cols-3 md:justify-stretch md:p-2 lg:flex lg:flex-wrap lg:justify-end lg:p-1.5">
                                  <Link
                                    to={viewTo}
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-center text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 sm:min-h-0 sm:px-3 sm:py-2"
                                  >
                                    {isActivePublic ? t('dashboard.owner.properties.viewLive') : t('dashboard.owner.properties.preview')}
                                  </Link>
                                  <Link
                                    to={`/owner-dashboard/my-properties/${property.propertyId}/edit`}
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-emerald-600 px-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:min-h-0 sm:px-3 sm:py-2"
                                  >
                                    {t('common.edit')}
                                  </Link>
                                  {toPause ? (
                                    <button
                                      type="button"
                                      disabled={!!propertyBusyKey}
                                      onClick={() => handlePauseListing(property.propertyId, toPause.listingId)}
                                      className="flex min-h-[42px] items-center justify-center rounded-lg bg-amber-50 px-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80 transition hover:bg-amber-100 disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2"
                                    >
                                      {rowBusy && propertyBusyKey?.startsWith('p:') ? t('dashboard.owner.properties.pausing') : t('dashboard.owner.properties.pause')}
                                    </button>
                                  ) : null}
                                  {toResume ? (
                                    <button
                                      type="button"
                                      disabled={!!propertyBusyKey}
                                      onClick={() => handleResumeListing(property.propertyId, toResume.listingId)}
                                      className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50/80 disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2"
                                    >
                                      {rowBusy && propertyBusyKey?.startsWith('r:') ? t('dashboard.owner.properties.resuming') : t('dashboard.owner.properties.resume')}
                                    </button>
                                  ) : null}
                                  <Link
                                    to="/owner-dashboard/requests"
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-center text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 sm:min-h-0 sm:px-3 sm:py-2"
                                  >
                                    {t('dashboard.owner.properties.requests')}
                                  </Link>
                                  <button
                                    type="button"
                                    disabled={!!propertyBusyKey}
                                    onClick={() => handleDeleteProperty(property.propertyId)}
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-xs font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-50 disabled:opacity-50 sm:min-h-0 sm:bg-transparent sm:px-3 sm:py-2 sm:ring-0"
                                  >
                                    {propertyBusyKey === `d:${property.propertyId}` ? t('common.deleting') : t('common.delete')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              <section className="flex min-h-0 flex-col rounded-2xl border border-emerald-100/80 bg-white shadow-sm lg:col-span-5 lg:col-start-8 lg:row-start-1">
                <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
                  <h2 className="text-lg font-bold text-gray-900">{t('dashboard.owner.tenantRequests.title')}</h2>
                  <Link
                    to="/owner-dashboard/requests"
                    className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
                  >
                    {t('common.viewAll')}
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  {pendingRequests.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                      {t('dashboard.owner.tenantRequests.empty')}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {pendingRequests.slice(0, 5).map((item) => (
                        <li
                          key={item.requestId}
                          className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:p-4"
                        >
                          <div className="flex gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                              {initialsFromName(item.tenant?.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-gray-900">
                                {item.tenant?.userId ? (
                                  <Link to={`/profile/${item.tenant.userId}`} className="hover:text-emerald-800">
                                    {item.tenant?.name || t('roles.tenant')}
                                  </Link>
                                ) : (
                                  item.tenant?.name || t('roles.tenant')
                                )}
                              </p>
                              <p className="truncate text-xs text-gray-500">{item.tenant?.phone || item.tenant?.email || t('common.dash')}</p>
                              <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(item.requestedAt, t)}</p>
                              <Link
                                to={`/listings/${item.listingId}`}
                                className="mt-2 inline-block text-xs font-medium text-emerald-700 hover:underline"
                              >
                                {t('common.listingNumber', { id: item.listingId })}
                              </Link>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              to="/owner-dashboard/requests"
                              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-center text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                            >
                              {t('dashboard.owner.tenantRequests.viewRequest')}
                            </Link>
                            <button
                              type="button"
                              disabled={reviewingId === item.requestId}
                              onClick={() => handleReview(item, 'ACCEPT')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {reviewingId === item.requestId ? '...' : t('common.approve')}
                            </button>
                            <button
                              type="button"
                              disabled={reviewingId === item.requestId}
                              onClick={() => handleReview(item, 'REJECT')}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              {t('common.reject')}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="flex min-h-0 flex-col rounded-2xl border border-emerald-100/80 bg-white shadow-sm lg:col-span-5 lg:col-start-8 lg:row-start-2">
                <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
                  <h2 className="text-lg font-bold text-gray-900">{t('dashboard.owner.payments.title')}</h2>
                  <Link to="/wallet" className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-900">
                    {t('common.viewAll')}
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  {transactions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                      {t('dashboard.owner.payments.empty')}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {transactions.map((txn) => (
                        <li
                          key={txn.transactionId || txn.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {txn.description || txn.type || t('common.transaction')}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {txn.type} - {txn.status || t('common.dash')}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(txn.createdAt, t)}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                              txn.direction === 'CREDIT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                            }`}
                          >
                            {txn.direction === 'CREDIT' ? '+' : '-'}
                            {formatBdt(txn.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
        </main>
      </div>
    </div>
  );
}


