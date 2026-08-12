import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch, getCurrentUser, isLoggedIn } from '../lib/api';
import PropertySearchBar from '../components/PropertySearchBar';
import AppHeader from '../components/AppHeader';
import ListingCard from '../components/ListingCard';
import { buildListingsQuery, expandAreasForQuery } from '../lib/listingSearchQuery';
import { toggleWishlist } from '../lib/wishlist';
import toast from 'react-hot-toast';
import { useTranslation } from '../lib/i18n';
import { homeSectionInner } from '../components/home/homeLayout';

const VALID_MAX_TIERS = new Set(['20000', '35000', '50000', '80000', '100000', '200000']);

function parseFiltersFromSearchParams(searchParams) {
  const areas = [];
  const fromRepeated = searchParams.getAll('areaName').filter(Boolean);
  if (fromRepeated.length) areas.push(...fromRepeated.map((a) => String(a).trim().toUpperCase()));
  const csv = searchParams.get('areas');
  if (csv) areas.push(...csv.split(',').map((s) => String(s).trim().toUpperCase()).filter(Boolean));
  const single = searchParams.get('area');
  if (single && areas.length === 0) areas.push(String(single).trim().toUpperCase());
  const uniqueAreas = [...new Set(areas)];

  const rawCat = (searchParams.get('category') || '').toUpperCase();
  const category = rawCat === 'COMMERCIAL' || rawCat === 'RESIDENTIAL' ? rawCat : '';

  let maxRentKey = '';
  const minR = searchParams.get('minRent');
  const maxR = searchParams.get('maxRent');
  if (minR === '200000' && !maxR) maxRentKey = '200K_PLUS';
  else if (maxR && VALID_MAX_TIERS.has(String(maxR))) maxRentKey = String(maxR);

  const mr = searchParams.get('minRooms');
  const minRooms = ['1', '2', '3', '4', '5'].includes(mr) ? mr : '';

  const sortRaw = searchParams.get('sort') || searchParams.get('sort_by') || 'newest';
  const sort_by = ['newest', 'price_asc', 'price_desc'].includes(sortRaw) ? sortRaw : 'newest';

  return { areas: uniqueAreas, category, maxRentKey, minRooms, sort_by };
}

export default function ListingsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    queueMicrotask(() => {
      void refreshWishlistIds();
    });
  }, [refreshWishlistIds]);

  const paramsKey = useMemo(() => searchParams.toString(), [searchParams]);
  const filters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const currentUser = getCurrentUser();
  const canWishlist =
    isLoggedIn() && (currentUser?.role || currentUser?.userRole) === 'TENANT';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const normalizedAreas = expandAreasForQuery(filters.areas);
        const selectedAreas = normalizedAreas.length ? normalizedAreas : [null];

        const sortMap = {
          newest: ['createdAt', 'desc'],
          price_asc: ['rent', 'asc'],
          price_desc: ['rent', 'desc'],
        };
        const [sortBy, sortDir] = sortMap[filters.sort_by] || sortMap.newest;

        const responses = await Promise.all(
          selectedAreas.map(async (area) => {
            const q = new URLSearchParams();
            q.set('page', '1');
            q.set('limit', '100');
            q.set('sortBy', sortBy);
            q.set('sortDir', sortDir);
            if (area) q.set('areaName', String(area).toUpperCase());
            if (filters.category) q.set('propertyCategory', filters.category);
            if (filters.maxRentKey === '200K_PLUS') q.set('minRent', '200000');
            else if (filters.maxRentKey) q.set('maxRent', String(filters.maxRentKey));
            if (filters.minRooms) q.set('minRoomCount', String(filters.minRooms));

            const res = await apiFetch(`/properties/public/listings?${q.toString()}`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || body?.message || t('listings.errors.loadFailed'));
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
        setError(e.message || t('listings.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    load();
    // filtersKey serializes URL-derived filters; avoids refetch when unrelated parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const handleSearchSubmit = (payload) => {
    const qs = buildListingsQuery(payload);
    if (qs) setSearchParams(new URLSearchParams(qs));
    else setSearchParams({});
  };

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
    toast.success(nextSave ? t('listings.toast.saved') : t('listings.toast.removed'));
  };

  const handleViewCountUpdate = (listingId, viewCount) => {
    setListings((prev) =>
      prev.map((item) => (item.listingId === listingId ? { ...item, viewCount } : item))
    );
  };

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-slate-800">
      <AppHeader centerNav />

      <main className={`${homeSectionInner} py-4 sm:py-6 lg:py-8`}>
        <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t('listings.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('listings.subtitle')}</p>
          <div className="mt-4">
            <PropertySearchBar
              key={paramsKey}
              showSort
              initialValues={filters}
              onSubmit={handleSearchSubmit}
            />
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
            {t('listings.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {listings.map((item) => (
              <ListingCard
                key={item.listingId}
                item={item}
                canWishlist={canWishlist}
                isWishlisted={wishlistIds.has(String(item.listingId))}
                onToggleWishlist={handleToggleWishlist}
                onViewCountUpdate={handleViewCountUpdate}
              />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

