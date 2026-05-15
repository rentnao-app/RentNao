import { StatCard } from './AdminUi';
import {
  formatBdt,
  formatRelativeTime,
  listingFeedBadge,
  pctChange,
  toLabel,
} from './adminDashboardUtils';

export default function AdminDashboardSection({
  stats,
  kycSubmissions,
  selectingListingId,
  onSelectListing,
  onSectionChange,
  onCloseMobile,
  analyticsTab,
  setAnalyticsTab,
}) {
  const pendingCount = stats?.pendingVerificationCount ?? kycSubmissions.length;
  const userWeekPct = pctChange(stats?.usersCreatedLast7Days, stats?.usersCreatedPrev7Days);
  const listingWeekPct = pctChange(stats?.listingsCreatedLast7Days, stats?.listingsCreatedPrev7Days);
  const recentListingsFeed = stats?.recentListings || [];
  const recentPaymentsFeed = stats?.recentPayments || [];
  const recentUsersFeed = stats?.recentUsers || [];

  const displayUserName = (u) => {
    const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (n) return n;
    return u.contactEmail || u.contactPhone || u.userId || 'User';
  };

  const isJoinedThisWeek = (iso) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    return Date.now() - t < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <>
      <section className="mb-4 rounded-xl border border-gray-200/90 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-3.5">
        <h1 className="text-lg font-semibold tracking-tight text-[#1e4732] sm:text-xl">Welcome, Admin!</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-600 sm:text-sm">
          Manage listings, users, and keep track of platform activity.
        </p>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          title="Total Listings"
          value={(stats?.totalListings ?? 0).toLocaleString()}
          accent="emerald"
          iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
        <StatCard
          title="Total Users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          accent="amber"
          iconPath="M17 20h5v-1a4 4 0 00-5.546-3.69M9 20H2v-1a4 4 0 015.546-3.69M16 6a4 4 0 11-8 0 4 4 0 018 0z"
        />
        <StatCard
          title="Total Earnings"
          value={formatBdt(stats?.totalEarningsBdt ?? 0)}
          accent="sky"
          iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          title="Pending Verifications"
          value={pendingCount.toLocaleString()}
          accent="rose"
          iconPath="M12 9v4m0 4h.01M10.29 3.86l-8 14A1 1 0 003.15 20h17.7a1 1 0 00.86-1.5l-8-14a1 1 0 00-1.72 0z"
          footer={
            <button
              type="button"
              onClick={() => {
                onSectionChange('reports');
                onCloseMobile();
              }}
              className="w-full rounded-lg bg-emerald-700 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Review
            </button>
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12 xl:gap-5 xl:[&>section]:min-h-0">
        <section className="flex min-h-0 flex-col rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm sm:p-5 xl:col-span-7 xl:h-full xl:min-h-[22rem]">
          <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-gray-900">Recent Listings</h2>
            <button
              type="button"
              onClick={() => {
                onSectionChange('listings');
                onCloseMobile();
              }}
              className="inline-flex shrink-0 items-center text-xs font-semibold leading-none text-emerald-700 hover:text-emerald-900 sm:text-sm"
            >
              View All {'->'}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
              {recentListingsFeed.length === 0 ? (
                <p className="flex min-h-[12rem] flex-1 items-center justify-center rounded-lg bg-gray-50 px-2 py-7 text-center text-sm text-gray-500">
                  No listings yet.
                </p>
              ) : (
                recentListingsFeed.map((row) => {
                  const badge = listingFeedBadge(row.listingStatus);
                  return (
                    <div
                      key={row.listingId}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:flex-row sm:items-stretch sm:gap-4"
                    >
                      <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-gray-200 sm:aspect-auto sm:h-28 sm:w-36">
                        <img
                          src={row.imageUrl || '/hero-image.jpg'}
                          alt={row.title || 'Listing'}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/hero-image.jpg';
                          }}
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{row.title}</p>
                          <p className="mt-0.5 text-xs font-medium text-emerald-800 sm:text-sm">
                            {formatBdt(row.rent)} / month
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">{toLabel(row.areaName)}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectListing({ listingId: row.listingId });
                              onCloseMobile();
                            }}
                            disabled={selectingListingId === row.listingId}
                            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                          >
                            {selectingListingId === row.listingId ? 'Loading...' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm sm:p-5 xl:col-span-5 xl:h-full xl:min-h-[22rem]">
          <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-gray-900">New Users</h2>
            <button
              type="button"
              onClick={() => {
                onSectionChange('users');
                onCloseMobile();
              }}
              className="inline-flex shrink-0 items-center text-xs font-semibold leading-none text-emerald-700 hover:text-emerald-900 sm:text-sm"
            >
              View All {'->'}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            {recentUsersFeed.length === 0 ? (
              <p className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 py-7 text-center text-sm text-gray-500">
                No users yet.
              </p>
            ) : (
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                {recentUsersFeed.map((u) => {
                  const verified = u.kycVerificationStatus === 'APPROVED';
                  const isNew = isJoinedThisWeek(u.createdAt) && !verified;
                  return (
                    <li
                      key={u.userId}
                      className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 sm:gap-3 sm:p-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 sm:h-10 sm:w-10 sm:text-sm">
                        {(displayUserName(u).charAt(0) || '?').toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{displayUserName(u)}</p>
                        <p className="text-xs text-gray-500">
                          {u.role === 'OWNER' ? 'Property Owner' : u.role === 'TENANT' ? 'Tenant' : toLabel(u.role)}
                          {u.contactPhone ? ` - ${u.contactPhone}` : ''}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {verified ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 sm:text-[11px]">
                              Verified
                            </span>
                          ) : null}
                          {isNew ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 sm:text-[11px]">
                              New
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm sm:p-5 xl:col-span-7 xl:h-full xl:min-h-[22rem]">
          <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-gray-900">Recent Payments</h2>
            <button
              type="button"
              onClick={() => {
                onSectionChange('fees');
                onCloseMobile();
              }}
              className="inline-flex shrink-0 items-center text-xs font-semibold leading-none text-emerald-700 hover:text-emerald-900 sm:text-sm"
            >
              View All {'->'}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            {recentPaymentsFeed.length === 0 ? (
              <p className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 py-7 text-center text-sm text-gray-500">
                No posted wallet transactions yet.
              </p>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                {recentPaymentsFeed.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{p.userLabel}</p>
                      <p className="truncate text-xs text-gray-500">{p.description || toLabel(p.type)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-gray-900">{formatBdt(p.amount)}</p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(p.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/[0.35] to-teal-50/[0.45] p-3.5 shadow-sm sm:p-5 xl:col-span-5 xl:h-full xl:min-h-[22rem]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/25 blur-2xl" />
          <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
            <h2 className="min-w-0 flex-1 truncate text-base font-bold leading-snug text-gray-900">System Analytics</h2>
            <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200/80 bg-white/90 px-2.5 py-1 text-xs font-semibold leading-none text-emerald-800 sm:text-sm">
              Past 7 days
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
              <div className="inline-flex shrink-0 rounded-xl border border-emerald-200/80 bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setAnalyticsTab('users')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    analyticsTab === 'users' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-emerald-50/70'
                  }`}
                >
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsTab('properties')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    analyticsTab === 'properties' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-emerald-50/70'
                  }`}
                >
                  Properties
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-emerald-100/80 bg-white/90 px-3 py-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {analyticsTab === 'users' ? 'New registrations' : 'Listing activity'}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-[1.7rem]">
                    {analyticsTab === 'users'
                      ? (stats?.usersCreatedLast7Days ?? 0).toLocaleString()
                      : (stats?.listingsCreatedLast7Days ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {analyticsTab === 'users'
                      ? `${(stats?.activeToday ?? 0).toLocaleString()} active users today`
                      : `${(stats?.activeListingsCount ?? 0).toLocaleString()} live listings`}
                  </p>
                  <div className="mt-auto flex h-12 shrink-0 items-end gap-0.5 pt-3 sm:h-14 sm:gap-1">
                    {[35, 50, 42, 68, 55, 72, 60].map((h, i) => (
                      <div
                        key={i}
                        className="min-w-0 flex-1 rounded-t bg-gradient-to-t from-emerald-500/80 to-emerald-300/80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col justify-center rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2.5 text-right shadow-sm sm:max-w-[11rem] sm:self-stretch">
                  <p className="text-[11px] font-semibold text-emerald-800">
                    {analyticsTab === 'users'
                      ? `${userWeekPct >= 0 ? '+' : ''}${userWeekPct}% this week`
                      : `${listingWeekPct >= 0 ? '+' : ''}${listingWeekPct}% this week`}
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-900 sm:text-xl">
                    {analyticsTab === 'users'
                      ? (stats?.totalUsers ?? 0).toLocaleString()
                      : (stats?.activeListingsCount ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-800">
                    {analyticsTab === 'users' ? 'Registered users' : 'Listed properties'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
