import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWishlistState, removeFromWishlist } from '../lib/wishlist';
import { getCurrentUser, isLoggedIn } from '../lib/api';
import toast from 'react-hot-toast';

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
  if (!name) return 'Unknown area';
  return String(name).replaceAll('_', ' ');
}

export default function WishlistPage() {
  const [loading, setLoading] = useState(true);
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [items, setItems] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const viewerRole = currentUser?.role || currentUser?.userRole;
  const topNavItems = [
    { to: '/', label: 'Home' },
    ...(viewerRole === 'OWNER' ? [] : [{ to: '/listings', label: 'Find Property' }]),
    ...(viewerRole === 'TENANT' ? [] : [{ to: '/owner-dashboard/create-listing', label: 'List Your Property' }]),
    { to: '/services', label: 'Services' },
  ];
  const dashboardPath =
    viewerRole === 'ADMIN' ? '/admin-dashboard' : viewerRole === 'OWNER' ? '/owner-dashboard' : '/tenant-dashboard';

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

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const handleRemove = async (listingId) => {
    await removeFromWishlist(listingId);
    setItems((prev) => prev.filter((entry) => entry.listingId !== listingId));
    toast.success('Removed from wishlist');
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
            <Link
              to="/listings"
              className={`rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition sm:px-4 ${
                loggedIn
                  ? 'border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              Browse
            </Link>
            {loggedIn ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4"
              >
                Dashboard
              </Link>
            ) : null}
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
            id="wishlist-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eef4ef]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover border border-green-100 shrink-0" />
                <p id="wishlist-mobile-nav-title" className="font-semibold text-[#1e4732] text-sm tracking-tight truncate">
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

              <Link
                to="/listings"
                onClick={() => setMobileNavOpen(false)}
                className="mt-2 mx-1 rounded-xl border border-emerald-200 bg-white text-emerald-800 text-center text-[15px] font-semibold py-3.5 shadow-sm transition hover:bg-emerald-50"
              >
                Browse
              </Link>

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
        <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Wishlist</h1>
              <p className="mt-1 text-sm text-slate-500">
                Saved homes you want to revisit. Open a card for full details or remove when you are done.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
                  {items.length} saved
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                    remoteAvailable
                      ? 'bg-slate-50 text-slate-700 ring-slate-200'
                      : 'bg-amber-50 text-amber-900 ring-amber-100'
                  }`}
                >
                  {remoteAvailable ? 'Synced' : 'Local only'}
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
                Refresh
              </button>
              <Link
                to="/listings"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Find more
              </Link>
            </div>
          </div>
          {!remoteAvailable ? (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
              Wishlist is stored on this device until the account wishlist API is available. Sign in as a tenant for cloud sync when supported.
            </p>
          ) : null}
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-16 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
            <p className="text-sm text-slate-500">Loading your saved listings...</p>
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
            <p className="text-base font-semibold text-slate-900">No saved listings yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Tap the heart on any listing while signed in as a tenant. Your picks will show up here.
            </p>
            <Link
              to="/listings"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const title =
                item.title?.trim() ||
                `Apartment - ${item.roomCount != null ? item.roomCount : '?'} beds`;
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
                        Saved
                      </span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{areaLabel(item.areaName)}</p>
                      <h2 className="line-clamp-2 text-base font-bold text-slate-900 transition group-hover:text-emerald-800 sm:text-lg">
                        {title}
                      </h2>
                      <p className="mt-1 text-lg font-bold text-emerald-800">{rentLabel}/mo</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>{item.bathroomCount ?? '?'} baths</span>
                        <span className="hidden sm:inline">-</span>
                        <span>{item.propertySizeSqft != null ? `${item.propertySizeSqft.toLocaleString()} sq.ft` : '- sq.ft'}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
                    <Link
                      to={`/listings/${item.listingId}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 min-[380px]:flex-none"
                    >
                      View details
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleRemove(item.listingId)}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 min-[380px]:flex-none"
                    >
                      Remove
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

