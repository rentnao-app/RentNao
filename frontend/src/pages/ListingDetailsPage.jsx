import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch, getCurrentUser, isLoggedIn } from '../lib/api';
import toast from 'react-hot-toast';
import ImageGallery from '../components/ImageGallery';
import MapView from '../components/MapView';
import WishlistHeartButton from '../components/WishlistHeartButton';
import { getWishlistState } from '../lib/wishlist';
import { getTenantRequestForListing, withdrawTenantRequest } from '../lib/requests';
import { addLocalNotification } from '../lib/notifications';

function formatBdt(n) {
  if (n == null || Number.isNaN(Number(n))) return '-';
  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(Number(n));
  } catch {
    return `BDT ${Number(n).toLocaleString()}`;
  }
}

function areaLabel(name) {
  if (!name) return 'Area';
  return String(name).replaceAll('_', ' ');
}

function formatTenantType(v) {
  if (!v) return '-';
  return String(v).replaceAll('_', ' ');
}

function relativeListed(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just listed';
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function Icon({ children, className = 'h-5 w-5' }) {
  return (
    <span className={`inline-flex shrink-0 text-emerald-700 ${className}`} aria-hidden>
      {children}
    </span>
  );
}

function SpecRow({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function ListingDetailsPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestRecord, setRequestRecord] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [loggedIn] = useState(() => isLoggedIn());
  const [currentUser] = useState(() => getCurrentUser());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const viewerRole = currentUser?.role || currentUser?.userRole;
  const topNavItems = [
    { to: '/', label: 'Home' },
    ...(viewerRole === 'OWNER' ? [] : [{ to: '/listings', label: 'Find Property' }]),
    ...(viewerRole === 'TENANT' ? [] : [{ to: '/owner-dashboard/create-listing', label: 'List Your Property' }]),
    { to: '/services', label: 'Services' },
  ];
  const canWishlist = loggedIn && viewerRole === 'TENANT';
  const isTenant = loggedIn && viewerRole === 'TENANT';
  const isOwner = loggedIn && viewerRole === 'OWNER';
  const dashboardPath =
    viewerRole === 'ADMIN'
      ? '/admin-dashboard'
      : viewerRole === 'OWNER'
        ? '/owner-dashboard'
        : '/tenant-dashboard';

  const loadListing = useCallback(async () => {
    const publicRes = await apiFetch(`/properties/public/listings/${id}`);
    const publicBody = await publicRes.json().catch(() => ({}));
    if (!publicRes.ok) {
      throw new Error(publicBody?.error || publicBody?.message || 'Failed to load listing');
    }
    let merged = publicBody.data;

    if (loggedIn) {
      const unlockedRes = await apiFetch(`/properties/listings/${id}/details`);
      if (unlockedRes.ok) {
        const unlockedBody = await unlockedRes.json().catch(() => ({}));
        merged = unlockedBody.data || merged;
      }
    }

    setListing(merged);
  }, [id, loggedIn, viewerRole]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        await loadListing();
      } catch (e) {
        setError(e.message || 'Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [loadListing]);

  useEffect(() => {
    let cancelled = false;
    if (!listing) return undefined;
    const areaKey = listing.areaName;
    if (!areaKey) {
      setRelated([]);
      return undefined;
    }
    void (async () => {
      try {
        if (!cancelled) setRelated([]);
        const q = new URLSearchParams();
        q.set('page', '1');
        q.set('limit', '20');
        q.set('areaName', String(areaKey).toUpperCase());
        const res = await apiFetch(`/properties/public/listings?${q.toString()}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setRelated([]);
          return;
        }
        const items = body?.data?.items || [];
        setRelated(
          items
            .filter((x) => String(x.listingId) !== String(id))
            .filter((x) => String(x.areaName || '').toUpperCase() === String(areaKey).toUpperCase())
            .slice(0, 4)
        );
      } catch {
        if (!cancelled) setRelated([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listing, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void getWishlistState().then((state) => {
        setWishlisted(state.ids.has(String(id)));
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (!isTenant) return;
    const timer = setTimeout(() => {
      void getTenantRequestForListing(id).then((record) => setRequestRecord(record));
    }, 0);
    return () => clearTimeout(timer);
  }, [id, isTenant]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [id]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const isPrivilegedViewer = isOwner || viewerRole === 'ADMIN';
  const hasAccess = isPrivilegedViewer || Boolean(listing?.isUnlocked);
  const listingActive = (listing?.listingStatus || listing?.listing_status) === 'ACTIVE';

  const availabilityLabel = useMemo(() => {
    if (!listing?.listingStartDate) return 'Available now';
    const start = new Date(listing.listingStartDate);
    if (Number.isNaN(start.getTime())) return 'Available now';
    if (start.getTime() > Date.now()) return `From ${start.toLocaleDateString()}`;
    return 'Available now';
  }, [listing]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f3]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f3] px-4">
        <div className="text-center">
          <p className="mb-4 text-slate-600">{error || 'Listing not found.'}</p>
          <Link to="/listings" className="text-sm font-semibold text-emerald-800 hover:text-emerald-900">
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  const title = listing.title || 'Property listing';
  const area = areaLabel(listing.areaName);

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-emerald-100/90 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 lg:px-6">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2" onClick={() => setMobileNavOpen(false)}>
            <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg border border-emerald-100 object-cover" />
            <span className="truncate text-lg font-semibold tracking-tight text-[#2f8444] sm:text-xl">Rent Nao</span>
          </Link>

          <nav className="mx-auto hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {topNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-50/80 hover:text-emerald-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {loggedIn ? (
              <Link
                to={dashboardPath}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-800 lg:inline"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className="hidden sm:inline rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-800">
                  Register
                </Link>
                <Link to="/login" className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:text-emerald-800 sm:px-3">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </header>

      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px] motion-reduce:backdrop-blur-none animate-mobile-nav-backdrop motion-reduce:animate-none motion-reduce:opacity-100"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside
            id="listing-details-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-details-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eef4ef]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover border border-green-100 shrink-0" />
                <p id="listing-details-mobile-nav-title" className="font-semibold text-[#1e4732] text-sm tracking-tight truncate">
                  Rent Nao
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-1" aria-label="Mobile">
              {topNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {loggedIn ? (
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileNavOpen(false)}
                  className="mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition"
                >
                  Dashboard
                </Link>
              ) : null}
            </nav>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        <nav className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm" aria-label="Breadcrumb">
          <Link to="/" className="font-medium text-emerald-800 hover:underline">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link to="/listings" className="font-medium text-emerald-800 hover:underline">
            {area}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="max-w-[min(100%,42rem)] truncate font-medium text-slate-700">{title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start xl:gap-6">
          {/* Left - specs */}
          <aside className="order-2 space-y-3 xl:order-1 xl:col-span-3 xl:row-start-1">
            <div className="flex gap-2 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
              <span className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-center text-xs font-semibold text-white">
                Residential
              </span>
              <span className="flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold text-slate-400">Commercial</span>
            </div>
            <div className="space-y-2">
              <SpecRow
                label="Bedrooms"
                value={listing.roomCount != null ? String(listing.roomCount) : '-'}
                icon={
                  <Icon>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4-4 4 4 6-6M5 5h14v14H5V5z" />
                    </svg>
                  </Icon>
                }
              />
              <SpecRow
                label="Bathrooms"
                value={listing.bathroomCount != null ? String(listing.bathroomCount) : '-'}
                icon={
                  <Icon>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14v3M12 14v3M16 14v3M4 21h16M6 10h12l1 8H5l1-8zM6 10V7a2 2 0 012-2h8a2 2 0 012 2v3" />
                    </svg>
                  </Icon>
                }
              />
              <SpecRow
                label="Size"
                value={listing.propertySizeSqft != null ? `${listing.propertySizeSqft.toLocaleString()} sq.ft` : '-'}
                icon={
                  <Icon>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                    </svg>
                  </Icon>
                }
              />
              <SpecRow
                label="Building floors"
                value={listing.buildingFloors != null ? String(listing.buildingFloors) : '-'}
                icon={
                  <Icon>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </Icon>
                }
              />
              <SpecRow
                label="Facing"
                value={listing.buildingFacing ? formatTenantType(listing.buildingFacing) : '-'}
                icon={
                  <Icon>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Icon>
                }
              />
              <SpecRow
                label="Tenant type"
                value={formatTenantType(listing.intendedTenantType)}
                icon={
                  <Icon>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Icon>
                }
              />
            </div>
            <div className="hidden rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/40 p-6 text-center xl:block">
              <p className="text-xs font-medium text-emerald-900">Verified listings on Rent Nao</p>
              <p className="mt-2 text-[11px] leading-relaxed text-emerald-800/90">
                Review details, unlock the exact location when you are ready, and connect with owners securely.
              </p>
            </div>
          </aside>

          {/* Center - gallery + copy + related */}
          <div className="order-1 space-y-5 xl:order-2 xl:col-span-6 xl:col-start-4 xl:row-start-1">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                    {title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
                      Verified
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200/80">
                      {listing.listingStatus || 'ACTIVE'}
                    </span>
                  </div>
                </div>
                {canWishlist ? (
                  <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                    <WishlistHeartButton
                      listingId={id}
                      saved={wishlisted}
                      onSavedChange={(_lid, next) => setWishlisted(next)}
                    />
                    <span className="text-sm font-medium text-slate-600">{wishlisted ? 'Saved' : 'Save'}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <ImageGallery images={listing.images || []} />
            </div>

            {hasAccess && listing?.exactLat != null && listing?.exactLng != null ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Map location</h2>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                  <MapView lat={listing.exactLat} lng={listing.exactLng} height="220px" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Map location</p>
                  <p className="text-xs text-slate-500">Unlock this listing to view the exact map pin.</p>
                </div>
              </div>
            )}

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Property details</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {listing.description || 'No description provided for this listing.'}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-slate-400">Area:</span>{' '}
                  <span className="font-medium text-slate-800">{area}</span>
                </p>
                <p>
                  <span className="text-slate-400">Balconies:</span>{' '}
                  <span className="font-medium text-slate-800">{listing.balconyCount ?? '-'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Lift:</span>{' '}
                  <span className="font-medium text-slate-800">{listing.hasLift ? 'Yes' : 'No'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Generator:</span>{' '}
                  <span className="font-medium text-slate-800">{listing.hasGenerator ? 'Yes' : 'No'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Security:</span>{' '}
                  <span className="font-medium text-slate-800">{listing.hasSecurityGuard ? 'Yes' : 'No'}</span>
                </p>
                {hasAccess && listing.address ? (
                  <p className="sm:col-span-2">
                    <span className="text-slate-400">Address:</span>{' '}
                    <span className="font-medium text-slate-800">{listing.address}</span>
                  </p>
                ) : null}
              </div>
            </section>

            {related.length > 0 ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">More in this area</h2>
                  <Link to="/listings" className="text-xs font-semibold text-emerald-800 hover:underline sm:text-sm">
                    View all
                  </Link>
                </div>
                <ul className="space-y-3">
                  {related.map((row) => (
                    <li key={row.listingId}>
                      <Link
                        to={`/listings/${row.listingId}`}
                        className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/30"
                      >
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                          {row.primaryImageUrl ? (
                            <img src={row.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-slate-400">No photo</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{row.title}</p>
                          <p className="mt-0.5 text-sm font-bold text-emerald-800">{formatBdt(row.rent)}/mo</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">Verified</span>
                            <span>{relativeListed(row.createdAt)}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="truncate">{areaLabel(row.areaName)}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* Right - price, terms, actions */}
          <aside className="order-3 space-y-4 xl:col-span-3 xl:col-start-10 xl:row-start-1">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-2xl font-bold tracking-tight text-emerald-800 sm:text-3xl">{formatBdt(listing.rent)}</p>
              <p className="text-sm font-medium text-slate-500">per month</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-100">
                <span>{availabilityLabel}</span>
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
                <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Security deposit</span>
                  <span className="font-semibold text-slate-900">-</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Minimum lease</span>
                  <span className="font-semibold text-slate-900">12 months</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Tenant fit</span>
                  <span className="font-semibold text-slate-900 text-right">{formatTenantType(listing.intendedTenantType)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Category</span>
                  <span className="font-semibold text-slate-900">Residential</span>
                </div>
              </div>

              {isOwner ? (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Owner controls</p>
                  <Link
                    to="/owner-dashboard/requests"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Tenant requests
                  </Link>
                  <Link
                    to="/owner-dashboard/my-properties"
                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    My properties
                  </Link>
                </div>
              ) : null}

              {loggedIn && isTenant && listingActive ? (
                <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Tenant tools</p>
                  <h3 className="text-sm font-bold text-slate-900">Rental request</h3>
                  <p className="text-xs text-slate-500">
                    Message the owner; you can track or withdraw requests from your dashboard.
                  </p>
                  {requestRecord?.requestStatus === 'PENDING' ? (
                    <div className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-950 ring-1 ring-amber-100">
                      <p className="font-medium">Request pending</p>
                      <Link to="/tenant-dashboard/applications" className="mt-2 inline-block text-xs font-semibold text-emerald-800 hover:underline">
                        View my requests ->
                      </Link>
                      <button
                        type="button"
                        disabled={requestLoading}
                        onClick={async () => {
                          setRequestLoading(true);
                          const result = await withdrawTenantRequest(requestRecord.requestId);
                          setRequestLoading(false);
                          if (!result.ok) {
                            toast.error('Failed to withdraw request');
                            return;
                          }
                          setRequestRecord({ ...requestRecord, requestStatus: 'WITHDRAWN' });
                          addLocalNotification({
                            title: 'Request withdrawn',
                            message: 'You withdrew your tenant request.',
                            url: '/tenant-dashboard/applications',
                            type: 'REQUEST',
                          });
                          toast.success('Request withdrawn');
                        }}
                        className="mt-3 w-full rounded-lg bg-white py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
                      >
                        {requestLoading ? 'Working...' : 'Withdraw request'}
                      </button>
                    </div>
                  ) : requestRecord?.requestStatus === 'ACCEPTED' ? (
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-100">The owner accepted your request.</p>
                  ) : requestRecord?.requestStatus === 'REJECTED' ? (
                    <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-100">
                      Your request was declined. You can send another if the listing is still active.
                    </p>
                  ) : requestRecord?.requestStatus === 'WITHDRAWN' ? (
                    <p className="text-xs text-slate-600">You withdrew a previous request. You may send a new one below.</p>
                  ) : null}
                  {(!requestRecord || !['PENDING', 'ACCEPTED'].includes(requestRecord.requestStatus)) && (
                    <>
                      <label className="block text-xs font-medium text-slate-500" htmlFor="rental-msg">
                        Message (optional)
                      </label>
                      <textarea
                        id="rental-msg"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        maxLength={2000}
                        rows={3}
                        placeholder="Introduce yourself or ask a question"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        disabled={sendingRequest}
                        onClick={async () => {
                          setSendingRequest(true);
                          try {
                            const res = await apiFetch('/requests', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                listingId: id,
                                message: requestMessage.trim() || undefined,
                              }),
                            });
                            const body = await res.json().catch(() => ({}));
                            if (!res.ok) throw new Error(body.error || body.message || 'Could not send request');
                            toast.success(body.message || 'Rental request sent');
                            setRequestMessage('');
                            const rec = await getTenantRequestForListing(id);
                            setRequestRecord(rec);
                          } catch (e) {
                            toast.error(e.message || 'Failed to send request');
                          } finally {
                            setSendingRequest(false);
                          }
                        }}
                        className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                      >
                        {sendingRequest ? 'Sending...' : 'Send rental request'}
                      </button>
                    </>
                  )}
                </div>
              ) : null}

              {loggedIn && isTenant && !hasAccess ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Unlock details</h3>
                  <p className="mt-1 text-xs text-slate-600">Address, map pin, and owner contact use a small wallet unlock.</p>
                  <button
                    type="button"
                    disabled={unlocking}
                    onClick={async () => {
                      setUnlocking(true);
                      try {
                        const res = await apiFetch(`/properties/listings/${id}/unlock`, { method: 'POST' });
                        const body = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(body?.error || body?.message || 'Failed to unlock listing');
                        await loadListing();
                        toast.success(body?.message || 'Listing unlocked');
                      } catch (e) {
                        toast.error(e.message || 'Failed to unlock listing');
                      } finally {
                        setUnlocking(false);
                      }
                    }}
                    className="mt-3 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {unlocking ? 'Unlocking...' : 'Unlock listing'}
                  </button>
                </div>
              ) : null}

              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold text-slate-900">Owner contact</h3>
                {hasAccess ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="text-slate-500">Email:</span>{' '}
                      <span className="font-medium">{listing.ownerContact?.email || '-'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Phone:</span>{' '}
                      <span className="font-medium">{listing.ownerContact?.phone || '-'}</span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Unlock the listing to view owner contact details.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}


