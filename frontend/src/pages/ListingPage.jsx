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

const PAGE_SIZE = 9;
const VALID_MAX_TIERS = new Set(['20000', '35000', '50000', '80000', '100000', '200000']);

const SORT_VALUES = [
  { value: 'newest', labelKey: 'search.sort.newest' },
  { value: 'price_asc', labelKey: 'search.sort.priceAsc' },
  { value: 'price_desc', labelKey: 'search.sort.priceDesc' },
];

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

  const q = (searchParams.get('q') || '').trim();
  const pageRaw = Number(searchParams.get('page') || '1');
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  return { areas: uniqueAreas, category, maxRentKey, minRooms, sort_by, q, page };
}

function getVisiblePages(page, totalPages, windowSize = 5) {
  if (totalPages <= windowSize) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  let end = start + windowSize - 1;
  if (end > totalPages) {
    end = totalPages;
    start = end - windowSize + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(page, totalPages);
  const btnClass =
    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={btnClass}
        aria-label="Previous page"
      >
        ‹
      </button>
      {pages[0] > 1 ? (
        <>
          <button type="button" onClick={() => onPageChange(1)} className={btnClass}>
            1
          </button>
          {pages[0] > 2 ? <span className="px-1 text-slate-400">…</span> : null}
        </>
      ) : null}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
            p === page
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages ? (
        <>
          {pages[pages.length - 1] < totalPages - 1 ? <span className="px-1 text-slate-400">…</span> : null}
          <button type="button" onClick={() => onPageChange(totalPages)} className={btnClass}>
            {totalPages}
          </button>
        </>
      ) : null}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={btnClass}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}

export default function ListingsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchDraft, setSearchDraft] = useState(() => searchParams.get('q') || '');

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
  const filtersKey = useMemo(() => JSON.stringify({ ...filters, page: undefined }), [filters]);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  const currentUser = getCurrentUser();
  const canWishlist = isLoggedIn() && (currentUser?.role || currentUser?.userRole) === 'TENANT';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const filteredListings = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((item) => {
      const title = String(item?.title || '').toLowerCase();
      const area = String(item?.areaName || '').replaceAll('_', ' ').toLowerCase();
      return title.includes(q) || area.includes(q);
    });
  }, [listings, filters.q]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const paginatedListings = filteredListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateSearchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value == null || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next);
  };

  const handleSearchSubmit = (payload) => {
    const qs = buildListingsQuery(payload);
    const next = new URLSearchParams(qs || '');
    if (searchDraft.trim()) next.set('q', searchDraft.trim());
    else next.delete('q');
    next.delete('page');
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const handleTextSearch = (e) => {
    e.preventDefault();
    updateSearchParams({ q: searchDraft.trim(), page: '' });
  };

  const handleSortChange = (sort_by) => {
    updateSearchParams({ sort: sort_by, sort_by, page: '' });
  };

  const handlePageChange = (page) => {
    updateSearchParams({ page: page === 1 ? '' : String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setListings((prev) => prev.map((item) => (item.listingId === listingId ? { ...item, viewCount } : item)));
  };

  const sortOptions = SORT_VALUES.map(({ value, labelKey }) => ({ value, label: t(labelKey) }));

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-slate-800">
      <AppHeader variant="wide" centerNav />

      <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5 sm:py-7 lg:px-6 lg:py-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[2rem]">
          {t('listings.title')}
        </h1>

        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form onSubmit={handleTextSearch} className="min-w-0 flex-1">
              <label htmlFor="browse-search" className="sr-only">
                {t('listings.searchPlaceholder')}
              </label>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
                <input
                  id="browse-search"
                  type="search"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder={t('listings.searchPlaceholder')}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:text-base"
                />
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  filtersOpen
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/60'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-4V4m6 12v2m0-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                {t('listings.filters')}
              </button>

              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-2.5 transition ${viewMode === 'grid' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}
                  aria-label={t('listings.viewGrid')}
                  aria-pressed={viewMode === 'grid'}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-2.5 transition ${viewMode === 'list' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}
                  aria-label={t('listings.viewList')}
                  aria-pressed={viewMode === 'list'}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <label htmlFor="browse-sort" className="sr-only">
                {t('search.sortSrOnly')}
              </label>
              <select
                id="browse-sort"
                value={filters.sort_by}
                onChange={(e) => handleSortChange(e.target.value)}
                className="min-w-[9.5rem] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtersOpen ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <PropertySearchBar key={paramsKey} showSort initialValues={filters} onSubmit={handleSearchSubmit} />
            </div>
          ) : null}

          <p className="text-sm font-medium text-slate-500">
            {t('listings.resultsCount', { count: filteredListings.length })}
          </p>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-500">
            {t('listings.empty')}
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
                  : 'mt-5 flex flex-col gap-4'
              }
            >
              {paginatedListings.map((item) => (
                <ListingCard
                  key={item.listingId}
                  item={item}
                  variant="browse"
                  layout={viewMode}
                  canWishlist={canWishlist}
                  isWishlisted={wishlistIds.has(String(item.listingId))}
                  onToggleWishlist={handleToggleWishlist}
                  onViewCountUpdate={handleViewCountUpdate}
                />
              ))}
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </main>
    </div>
  );
}
