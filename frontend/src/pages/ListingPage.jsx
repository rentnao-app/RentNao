import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, getCurrentUser, isLoggedIn } from '../lib/api';
import SearchFilterPanel from '../components/SearchFilterPanel';
import { toggleWishlist } from '../lib/wishlist';
import toast from 'react-hot-toast';

function ListingCard({ item, canWishlist, isWishlisted, onToggleWishlist }) {
  const firstImage = item?.primaryImageUrl || null;
  const area = item.areaName ? String(item.areaName).replaceAll('_', ' ') : 'Unknown area';
  const title = item.title
    ? `${item.title.slice(0, 56)}${item.title.length > 56 ? '...' : ''}`
    : `Apartment - ${item.roomCount ?? '?'} beds`;
  const rent = Number(item.rent || 0).toLocaleString();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {canWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(item);
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-sm transition hover:bg-white"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className={`h-5 w-5 ${isWishlisted ? 'fill-current text-rose-500' : 'text-slate-500'}`} viewBox="0 0 24 24">
            <path d="M12.001 20.729l-1.09-.992C6.14 15.39 3 12.548 3 9.06 3 6.219 5.24 4 8.05 4c1.59 0 3.115.74 4.05 1.9C13.835 4.74 15.36 4 16.95 4 19.76 4 22 6.219 22 9.06c0 3.488-3.14 6.33-7.91 10.677l-1.089.992z" />
          </svg>
        </button>
      )}
      <Link to={`/listings/${item.listingId}`} className="block">
        <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 sm:h-48">
          {firstImage ? (
            <img src={firstImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg className="h-14 w-14 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            </svg>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{area}</p>
          <h2 className="text-base font-bold text-slate-900 transition group-hover:text-emerald-800 sm:text-lg">{title}</h2>
          <p className="mt-1 text-lg font-bold text-emerald-800">BDT {rent}/mo</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span>{item.bathroomCount ?? '?'} baths</span>
            <span>&middot;</span>
            <span>{item.propertySizeSqft ?? '?'} sqft</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Listed on {new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      </Link>
    </div>
  );
}

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const refreshWishlistIds = useCallback(async () => {
    const user = getCurrentUser();
    if (!isLoggedIn() || (user?.role || user?.userRole) !== 'TENANT') {
      setWishlistIds(new Set());
      return;
    }
    try {
      const res = await apiFetch('/wishlists');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const items = body?.data?.items ?? body?.data ?? body?.wishlist ?? [];
      const next = new Set(
        (Array.isArray(items) ? items : []).map((row) => row.listingId || row.listing_id || row?.listing?.listing_id).filter(Boolean)
      );
      setWishlistIds(next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshWishlistIds();
  }, [refreshWishlistIds]);

  const initialAreas = (() => {
    const explicitAreas = searchParams.getAll('areaName').filter(Boolean);
    if (explicitAreas.length > 0) return explicitAreas.map((item) => String(item).toUpperCase());
    const areasCsv = searchParams.get('areas');
    if (areasCsv) return areasCsv.split(',').map((item) => String(item).trim().toUpperCase()).filter(Boolean);
    const singleArea = searchParams.get('area');
    return singleArea ? [String(singleArea).trim().toUpperCase()] : [];
  })();

  const [filters, setFilters] = useState(() => ({
    areas: initialAreas,
    min_rent: searchParams.get('min_rent') || '',
    max_rent: searchParams.get('max_rent') || '',
    room_count: searchParams.get('room_count') || '',
    rent_ranges: [],
    sort_by: searchParams.get('sort_by') || 'newest',
  }));
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const viewerRole = currentUser?.role || currentUser?.userRole;
  const canWishlist = loggedIn && (currentUser?.role || currentUser?.userRole) === 'TENANT';
  const topNavItems = [
    { to: '/', label: 'Home' },
    ...(viewerRole === 'OWNER' ? [] : [{ to: '/listings', label: 'Find Property' }]),
    ...(viewerRole === 'TENANT' ? [] : [{ to: '/owner-dashboard/create-listing', label: 'List Your Property' }]),
    { to: '/services', label: 'Services' },
  ];
  const dashboardPath =
    viewerRole === 'ADMIN'
      ? '/admin-dashboard'
      : viewerRole === 'OWNER'
        ? '/owner-dashboard'
        : '/tenant-dashboard';

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const selectedAreas = filters.areas?.length ? filters.areas : [null];
        const selectedRanges = filters.rent_ranges?.length ? filters.rent_ranges : [null];

        const rangeMap = {
          '15-40K': { minRent: 15000, maxRent: 40000 },
          '40-60K': { minRent: 40000, maxRent: 60000 },
          '60-100K': { minRent: 60000, maxRent: 100000 },
          '100-200K': { minRent: 100000, maxRent: 200000 },
          '200K+': { minRent: 200000, maxRent: null },
        };

        const sortMap = {
          newest: ['createdAt', 'desc'],
          price_asc: ['rent', 'asc'],
          price_desc: ['rent', 'desc'],
        };
        const [sortBy, sortDir] = sortMap[filters.sort_by] || sortMap.newest;

        const requestCombos = [];
        selectedAreas.forEach((area) => {
          selectedRanges.forEach((rangeKey) => {
            requestCombos.push({ area, rangeKey });
          });
        });

        const responses = await Promise.all(
          requestCombos.map(async ({ area, rangeKey }) => {
            const q = new URLSearchParams();
            q.set('page', '1');
            q.set('limit', '100');
            q.set('sortBy', sortBy);
            q.set('sortDir', sortDir);
            if (area) q.set('areaName', String(area).toUpperCase());

            if (rangeKey && rangeMap[rangeKey]) {
              const selectedRange = rangeMap[rangeKey];
              if (selectedRange.minRent != null) q.set('minRent', String(selectedRange.minRent));
              if (selectedRange.maxRent != null) q.set('maxRent', String(selectedRange.maxRent));
            } else {
              if (filters.min_rent) q.set('minRent', String(filters.min_rent));
              if (filters.max_rent) q.set('maxRent', String(filters.max_rent));
            }

            if (filters.room_count) q.set('roomCount', String(filters.room_count));
            const res = await apiFetch(`/properties/public/listings?${q.toString()}`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || body?.message || 'Failed to load listings');
            return body.data?.items || [];
          })
        );

        const uniqueMap = new Map();
        responses.flat().forEach((item) => {
          if (!uniqueMap.has(item.listingId)) uniqueMap.set(item.listingId, item);
        });

        const merged = Array.from(uniqueMap.values());
        merged.sort((a, b) => {
          if (sortBy === 'rent') {
            return sortDir === 'asc' ? a.rent - b.rent : b.rent - a.rent;
          }
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
        });

        setListings(merged);
      } catch (e) {
        setError(e.message || 'Failed to load listings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const handleToggleWishlist = async (item) => {
    const id = String(item?.listingId || '');
    if (!id) return;
    const nextSave = !wishlistIds.has(id);
    await toggleWishlist(item, nextSave);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (nextSave) next.add(id);
      else next.delete(id);
      return next;
    });
    toast.success(nextSave ? 'Saved to wishlist' : 'Removed from wishlist');
  };

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
          <div className="ml-auto hidden lg:flex shrink-0 items-center gap-1.5 sm:gap-2">
            {loggedIn ? (
              <Link
                to={dashboardPath}
                className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4"
              >
                Dashboard
              </Link>
            ) : (
              <>
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
            id="listing-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eef4ef]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover border border-green-100 shrink-0" />
                <p id="listing-mobile-nav-title" className="font-semibold text-[#1e4732] text-sm tracking-tight truncate">
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
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileNavOpen(false)}
                    className="mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Available Listings</h1>
          <p className="mt-1 text-sm text-slate-500">Browse verified properties with flexible filters and quick actions.</p>
          <div className="mt-4">
            <SearchFilterPanel initialValues={filters} onSubmit={setFilters} />
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-500">
            No listings found for this filter set.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((item) => (
              <ListingCard
                key={item.listingId}
                item={item}
                canWishlist={canWishlist}
                isWishlisted={wishlistIds.has(String(item.listingId))}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

