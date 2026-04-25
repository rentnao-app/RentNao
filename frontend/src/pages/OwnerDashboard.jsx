import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch, getApiErrorMessage, getCurrentUser, getUserId, isLoggedIn, logout } from '../lib/api';
import { listOwnerIncomingRequests, reviewOwnerRequest } from '../lib/requests';
import { addLocalNotification } from '../lib/notifications';
import { savePublicProfileSnapshot } from '../lib/publicProfiles';
import NotificationBell from '../components/NotificationBell';

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

function formatRelativeTime(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
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

function listingStatusLabel(status) {
  if (status === 'UNLISTED') return 'Paused (inactive)';
  return status || '-';
}

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active only' },
];

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
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  /** `d:propertyId` | `p:propertyId:listingId` | `r:propertyId:listingId` */
  const [propertyBusyKey, setPropertyBusyKey] = useState(null);

  const closeDrawer = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

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
    if (!res.ok) throw new Error(body?.error || body?.message || 'Failed to load properties');
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
  }, []);

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
      toast.error(e?.message || 'Could not refresh dashboard');
    }
  }, [loadIncoming, loadProperties, loadTransactions]);

  const patchListingStatus = useCallback(async (propertyId, listingId, listingStatus) => {
    const res = await apiFetch(`/properties/${propertyId}/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingStatus }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, 'Could not update listing'));
  }, []);

  const handleDeleteProperty = useCallback(
    async (propertyId) => {
      const ok = window.confirm(
        'Permanently delete this property, all listings, images, and related data from the database? This cannot be undone.'
      );
      if (!ok) return;
      setPropertyBusyKey(`d:${propertyId}`);
      try {
        const res = await apiFetch(`/properties/${propertyId}`, { method: 'DELETE' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(getApiErrorMessage(body, 'Delete failed'));
        toast.success('Property permanently deleted');
        await refreshDashboard();
      } catch (e) {
        toast.error(e?.message || 'Delete failed');
      } finally {
        setPropertyBusyKey(null);
      }
    },
    [refreshDashboard]
  );

  const handlePauseListing = useCallback(
    async (propertyId, listingId) => {
      setPropertyBusyKey(`p:${propertyId}:${listingId}`);
      try {
        await patchListingStatus(propertyId, listingId, 'UNLISTED');
        toast.success('Listing paused - hidden from search');
        await refreshDashboard();
      } catch (e) {
        toast.error(e?.message || 'Pause failed');
      } finally {
        setPropertyBusyKey(null);
      }
    },
    [patchListingStatus, refreshDashboard]
  );

  const handleResumeListing = useCallback(
    async (propertyId, listingId) => {
      setPropertyBusyKey(`r:${propertyId}:${listingId}`);
      try {
        await patchListingStatus(propertyId, listingId, 'ACTIVE');
        toast.success('Listing is active again');
        await refreshDashboard();
      } catch (e) {
        toast.error(e?.message || 'Resume failed');
      } finally {
        setPropertyBusyKey(null);
      }
    },
    [patchListingStatus, refreshDashboard]
  );

  useEffect(() => {
    const run = async () => {
      if (!isLoggedIn()) {
        window.location.href = '/login';
        return;
      }
      setDashLoading(true);
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
        toast.error('Could not load dashboard');
      } finally {
        setDashLoading(false);
      }
    };
    void run();
  }, [loadIncoming, loadProperties, loadTransactions]);

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
  const avatarLetter = initialsFromName(welcomeName);

  const pathActive = (prefix, exact) => {
    if (exact) return location.pathname === prefix;
    return location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);
  };

  const sideLinks = [
    { to: '/owner-dashboard', label: 'Dashboard', icon: 'M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z', exact: true },
    { to: '/owner-dashboard/my-properties', label: 'My Properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { to: '/owner-dashboard/requests', label: 'Tenant Requests', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { to: '/wallet', label: 'Payments', icon: 'M17 9V7a4 4 0 10-8 0v2m-2 0h12a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z' },
    { to: '/account', label: 'Settings', icon: 'M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94L14.4 2.7a.5.5 0 0 0-.49-.4h-3.82a.5.5 0 0 0-.49.4L9.25 5.32c-.57.23-1.11.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.52.4 1.06.71 1.63.94l.35 2.62a.5.5 0 0 0 .49.4h3.82a.5.5 0 0 0 .49-.4l.35-2.62c.57-.23 1.11-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 12 15.5z' },
    { to: '/faq', label: 'Support', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm.1 15.5a1.4 1.4 0 1 1 1.4-1.4 1.4 1.4 0 0 1-1.4 1.4zM14.2 11c-.9.7-1.4 1.1-1.4 2v.3h-1.6v-.4c0-1.4.8-2.1 1.7-2.8.7-.5 1.2-.9 1.2-1.5a1.7 1.7 0 0 0-3.3-.6l-1.6-.4a3.3 3.3 0 1 1 6.5 1c0 1.4-.8 2-1.5 2.4z' },
  ];

  const centerNav = [
    { to: '/', label: 'Home' },
    { to: '/owner-dashboard/create-listing', label: 'List Your Property' },
    { to: '/services', label: 'Services' },
  ];

  const handleReview = async (item, decision) => {
    setReviewingId(item.requestId);
    try {
      const result = await reviewOwnerRequest(item.requestId, decision);
      if (!result.ok) {
        toast.error(decision === 'ACCEPT' ? 'Failed to approve' : 'Failed to reject');
        return;
      }
      addLocalNotification({
        title: decision === 'ACCEPT' ? 'Request approved' : 'Request rejected',
        message: `Listing #${item.listingId} - ${item.tenant?.name || 'Tenant'}.`,
        url: '/owner-dashboard/requests',
        type: 'REQUEST',
      });
      toast.success(decision === 'ACCEPT' ? 'Request approved' : 'Request rejected');
      await refreshDashboard();
    } finally {
      setReviewingId(null);
    }
  };

  if (dashLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f3]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-700" />
          <p className="text-sm font-medium text-gray-600">Loading your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-gray-800">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5" onClick={closeDrawer}>
            <img
              src="/logo.jpg"
              alt="Rent Nao"
              className="h-8 w-8 shrink-0 rounded-md border border-green-100 object-cover sm:h-9 sm:w-9"
            />
            <span className="truncate text-base font-semibold text-[#2f8444] sm:text-xl sm:tracking-tight">
              Rent Nao
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-4 sm:gap-5 shrink-0">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
              {centerNav.map((item) => (
                <Link key={item.to} to={item.to} className="text-gray-700 hover:text-emerald-700 transition">
                  {item.label}
                </Link>
              ))}
            </nav>

            <NotificationBell />
            <div
              className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-xs font-semibold text-white shadow-sm sm:h-9 sm:w-9 sm:text-sm"
              title={welcomeName}
            >
              {avatarLetter}
            </div>

            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="owner-mobile-nav"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px] motion-reduce:backdrop-blur-none animate-mobile-nav-backdrop motion-reduce:animate-none motion-reduce:opacity-100"
            aria-label="Close menu"
            onClick={closeDrawer}
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
              <img
                src="/logo.jpg"
                  alt=""
                  className="h-9 w-9 rounded-lg object-cover border border-green-100 shrink-0"
              />
                <div className="min-w-0">
                  <p id="owner-mobile-nav-title" className="font-semibold text-[#1e4732] text-sm tracking-tight truncate">
                    Rent Nao
                  </p>
                  <p className="text-xs text-gray-500 truncate">Owner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-1">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Dashboard</p>
              <nav className="flex flex-col gap-1" aria-label="Owner dashboard">
                {sideLinks.map((item) => (
                  <SidebarLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    iconPath={item.icon}
                    active={pathActive(item.to, item.exact)}
                    onNavigate={closeDrawer}
                  />
                ))}
              </nav>

              <div className="mt-4 pt-4 border-t border-[#eef4ef] px-1 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    logout();
                  }}
                  className="w-full rounded-xl bg-red-50 text-red-600 border border-red-100 py-3 text-sm font-semibold hover:bg-red-100 transition"
                >
                  Logout
                </button>
                <div className="rounded-2xl border border-emerald-100 bg-[#f9fcf9] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Profile Status</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">{user?.kycVerificationStatus || 'PENDING'}</p>
                  <div className="mt-3 h-2 rounded-full bg-emerald-100">
                    <div className="h-2 w-2/3 rounded-full bg-emerald-600" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Keep profile updated for better trust.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#eef4ef] px-4 py-3 bg-[#fafdfb]">
              <p className="text-xs text-center text-gray-500">
                {centerNav.map((item, idx) => (
                  <span key={item.to}>
                    <Link to={item.to} className="font-medium text-[#2f8444] hover:underline" onClick={closeDrawer}>
                      {item.label}
                    </Link>
                    {idx < centerNav.length - 1 ? <span className="mx-2 text-gray-300">·</span> : null}
                  </span>
                ))}
              </p>
            </div>
          </aside>
        </div>
      )}

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
                  onNavigate={closeDrawer}
                />
              ))}
            </nav>
          </div>

          <div className="px-4 pb-5">
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                logout();
              }}
              className="w-full rounded-xl bg-red-50 text-red-600 border border-red-100 py-2.5 text-sm font-semibold hover:bg-red-100 transition"
            >
              Logout
            </button>
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Profile Status</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{user?.kycVerificationStatus || 'PENDING'}</p>
              <div className="mt-3 h-2 rounded-full bg-emerald-100">
                <div className="h-2 w-2/3 rounded-full bg-emerald-600" />
              </div>
              <p className="mt-2 text-xs text-gray-500">Keep profile updated for better trust.</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-7">
            <section className="mb-5 rounded-2xl border border-emerald-100/80 bg-white p-4 shadow-sm sm:p-6 lg:mb-6">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Welcome, {welcomeName}!
              </h1>
              <p className="mt-1 max-w-xl text-sm text-gray-600">
                Manage your properties and connect with tenants easily.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100/90 bg-emerald-50/40 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                    <Icon className="h-5 w-5" path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{activeListingsCount}</p>
                    <p className="text-xs font-medium text-gray-600">Listings active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-amber-100/90 bg-amber-50/35 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-700 shadow-sm ring-1 ring-amber-100">
                    <Icon className="h-5 w-5" path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                    <p className="text-xs font-medium text-gray-600">Pending requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                    <Icon className="h-5 w-5" path="M10 5H8v14h2V5zm6 0h-2v14h2V5z" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{inactivePropertiesAll.length}</p>
                    <p className="text-xs font-medium text-gray-600">Inactive properties</p>
                  </div>
                </div>
              </div>
            </section>

            {/* lg+: properties cols 1-7; requests row 1 + payments row 2 in cols 8-12 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-5 lg:gap-x-6">
              <section className="flex min-h-0 flex-col rounded-2xl border border-emerald-100/80 bg-white shadow-sm lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <div className="border-b border-slate-100/90 bg-gradient-to-r from-slate-50/50 to-white px-4 pb-4 pt-4 sm:p-5">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">My Properties</h2>

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
                          aria-label="Filter properties"
                        >
                          {FILTER_OPTIONS.map((o) => (
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
                        View all
                      </Link>
                      <Link
                        to="/owner-dashboard/create-listing"
                        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
                      >
                        List property
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4 lg:px-5 lg:pb-6">
                  {previewProperties.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-12 text-center text-sm text-slate-500">
                      No properties yet.{' '}
                      <Link to="/owner-dashboard/create-listing" className="font-semibold text-emerald-700 hover:underline">
                        Create a listing
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
                                    No photo yet
                                  </div>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3.5">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                                      {property.title || 'Untitled property'}
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
                                        {listing.listingStatus === 'UNLISTED' ? 'Paused' : listing.listingStatus}
                                      </span>
                                    ) : null}
                                  </div>
                                  {rentLabel ? (
                                    <p className="mt-1.5 text-lg font-bold tabular-nums tracking-tight text-emerald-700">
                                      {rentLabel}
                                      <span className="text-sm font-semibold text-slate-500">/mo</span>
                                    </p>
                                  ) : (
                                    <p className="mt-1.5 text-sm font-medium text-slate-400">No listing yet</p>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/90 p-2 ring-1 ring-slate-100 sm:flex sm:flex-wrap sm:justify-end sm:gap-2 sm:p-1.5 md:grid md:grid-cols-3 md:justify-stretch md:p-2 lg:flex lg:flex-wrap lg:justify-end lg:p-1.5">
                                  <Link
                                    to={viewTo}
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-center text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 sm:min-h-0 sm:px-3 sm:py-2"
                                  >
                                    {isActivePublic ? 'View live' : 'Preview'}
                                  </Link>
                                  <Link
                                    to={`/owner-dashboard/my-properties/${property.propertyId}/edit`}
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-emerald-600 px-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:min-h-0 sm:px-3 sm:py-2"
                                  >
                                    Edit
                                  </Link>
                                  {toPause ? (
                                    <button
                                      type="button"
                                      disabled={!!propertyBusyKey}
                                      onClick={() => handlePauseListing(property.propertyId, toPause.listingId)}
                                      className="flex min-h-[42px] items-center justify-center rounded-lg bg-amber-50 px-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80 transition hover:bg-amber-100 disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2"
                                    >
                                      {rowBusy && propertyBusyKey?.startsWith('p:') ? 'Pausing...' : 'Pause'}
                                    </button>
                                  ) : null}
                                  {toResume ? (
                                    <button
                                      type="button"
                                      disabled={!!propertyBusyKey}
                                      onClick={() => handleResumeListing(property.propertyId, toResume.listingId)}
                                      className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50/80 disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2"
                                    >
                                      {rowBusy && propertyBusyKey?.startsWith('r:') ? 'Resuming...' : 'Resume'}
                                    </button>
                                  ) : null}
                                  <Link
                                    to="/owner-dashboard/requests"
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-center text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 sm:min-h-0 sm:px-3 sm:py-2"
                                  >
                                    Requests
                                  </Link>
                                  <button
                                    type="button"
                                    disabled={!!propertyBusyKey}
                                    onClick={() => handleDeleteProperty(property.propertyId)}
                                    className="flex min-h-[42px] items-center justify-center rounded-lg bg-white px-2 text-xs font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-50 disabled:opacity-50 sm:min-h-0 sm:bg-transparent sm:px-3 sm:py-2 sm:ring-0"
                                  >
                                    {propertyBusyKey === `d:${property.propertyId}` ? 'Deleting...' : 'Delete'}
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
                  <h2 className="text-lg font-bold text-gray-900">Pending tenant requests</h2>
                  <Link
                    to="/owner-dashboard/requests"
                    className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
                  >
                    View all
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  {pendingRequests.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                      No pending requests.
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
                                    {item.tenant?.name || 'Tenant'}
                                  </Link>
                                ) : (
                                  item.tenant?.name || 'Tenant'
                                )}
                              </p>
                              <p className="truncate text-xs text-gray-500">{item.tenant?.phone || item.tenant?.email || '-'}</p>
                              <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(item.requestedAt)}</p>
                              <Link
                                to={`/listings/${item.listingId}`}
                                className="mt-2 inline-block text-xs font-medium text-emerald-700 hover:underline"
                              >
                                Listing #{item.listingId}
                              </Link>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              to="/owner-dashboard/requests"
                              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-center text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                            >
                              View request
                            </Link>
                            <button
                              type="button"
                              disabled={reviewingId === item.requestId}
                              onClick={() => handleReview(item, 'ACCEPT')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {reviewingId === item.requestId ? '...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={reviewingId === item.requestId}
                              onClick={() => handleReview(item, 'REJECT')}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              Reject
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
                  <h2 className="text-lg font-bold text-gray-900">Recent payments</h2>
                  <Link to="/wallet" className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-900">
                    View all
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  {transactions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                      No wallet activity yet.
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
                              {txn.description || txn.type || 'Transaction'}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {txn.type} - {txn.status || '-'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(txn.createdAt)}</p>
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


