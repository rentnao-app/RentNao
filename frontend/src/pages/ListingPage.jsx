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
    ? `${item.title.slice(0, 56)}${item.title.length > 56 ? '…' : ''}`
    : `Apartment · ${item.roomCount ?? '?'} beds`;
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
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
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
        </div>
        {mobileNavOpen ? (
          <div className="border-t border-emerald-100 bg-white px-3 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              {topNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

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
