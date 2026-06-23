import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWishlistState, removeFromWishlist } from '../lib/wishlist';
import toast from 'react-hot-toast';
import AppHeader from '../components/AppHeader';
import { useTranslation } from '../lib/i18n';

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

function areaLabel(name, t) {
  if (!name) return t('common.unknownArea');
  const key = `common.areas.${name}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return String(name).replaceAll('_', ' ');
}

export default function WishlistPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const state = await getWishlistState();
      setItems(state.items || []);
      setRemoteAvailable(Boolean(state.remoteAvailable));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleRemove = async (listingId) => {
    await removeFromWishlist(listingId);
    setItems((prev) => prev.filter((entry) => entry.listingId !== listingId));
    toast.success(t('wishlist.toast.removed'));
  };

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-slate-800">
      <AppHeader variant="wide" />

      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t('wishlist.title')}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {t('wishlist.subtitle')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
                  {t('wishlist.savedCount', { n: items.length })}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                    remoteAvailable
                      ? 'bg-slate-50 text-slate-700 ring-slate-200'
                      : 'bg-amber-50 text-amber-900 ring-amber-100'
                  }`}
                >
                  {remoteAvailable ? t('wishlist.sync.synced') : t('wishlist.sync.localOnly')}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <svg className="h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t('common.refresh')}
              </button>
              <Link
                to="/listings"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                {t('wishlist.findMore')}
              </Link>
            </div>
          </div>
          {!remoteAvailable ? (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
              {t('wishlist.localWarning')}
            </p>
          ) : null}
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-16 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
            <p className="text-sm text-slate-500">{t('wishlist.loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-900">{t('wishlist.empty.title')}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {t('wishlist.empty.body')}
            </p>
            <Link
              to="/listings"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              {t('wishlist.empty.browse')}
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const title =
                item.title?.trim() ||
                t('wishlist.fallbackTitle', { beds: item.roomCount != null ? item.roomCount : '?' });
              const rentLabel = formatBdt(item.rent);
              return (
                <li
                  key={item.listingId}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Link to={`/listings/${item.listingId}`} className="block min-h-0 flex-1">
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 sm:h-48">
                      {item.primaryImageUrl ? (
                        <img src={item.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="h-14 w-14 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
                          />
                        </svg>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 shadow-sm ring-1 ring-emerald-100">
                        {t('wishlist.badge.saved')}
                      </span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{areaLabel(item.areaName, t)}</p>
                      <h2 className="line-clamp-2 text-base font-bold text-slate-900 transition group-hover:text-emerald-800 sm:text-lg">
                        {title}
                      </h2>
                      <p className="mt-1 text-lg font-bold text-emerald-800">{rentLabel}{t('common.perMonth')}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>{t('wishlist.specs.baths', { n: item.bathroomCount ?? '?' })}</span>
                        <span className="hidden sm:inline">-</span>
                        <span>
                          {item.propertySizeSqft != null
                            ? t('wishlist.specs.sqft', { n: item.propertySizeSqft.toLocaleString() })
                            : t('wishlist.specs.sqftMissing')}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
                    <Link
                      to={`/listings/${item.listingId}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 min-[380px]:flex-none"
                    >
                      {t('wishlist.actions.viewDetails')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleRemove(item.listingId)}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 min-[380px]:flex-none"
                    >
                      {t('wishlist.actions.remove')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

    </div>
  );
}
