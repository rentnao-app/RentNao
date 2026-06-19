import { useTranslation } from '../lib/i18n';

function StarIcon({ className = 'h-4 w-4', filled = true }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118L2.077 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 0 0 .95-.69l1.519-4.673z"
      />
    </svg>
  );
}

function StatsSkeleton() {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-7 sm:p-8 shadow-sm">
      <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
      <div className="mt-5 h-12 w-24 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-5 w-32 animate-pulse rounded bg-gray-100" />
      <div className="mt-7 space-y-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-3 w-full animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export default function ReviewStatsPanel({ stats, loading, error, onRetry }) {
  const { t } = useTranslation();

  if (loading) return <StatsSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 sm:p-7 text-sm text-rose-700">
        {error}{' '}
        {onRetry ? (
          <button type="button" className="font-semibold underline" onClick={onRetry}>
            {t('common.tryAgain')}
          </button>
        ) : null}
      </div>
    );
  }

  const averageRating = Number(stats?.averageRating ?? 0);
  const totalReviews = Number(stats?.totalReviews ?? 0);
  const distribution = Array.isArray(stats?.distribution) ? stats.distribution : [];
  const distributionByStar = Object.fromEntries(distribution.map((row) => [row.stars, row]));

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-7 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 text-emerald-800">
        <StarIcon className="h-7 w-7 text-amber-400" />
        <h2 className="text-xl font-bold text-gray-900">{t('reviews.stats.overallRating')}</h2>
      </div>

      <div className="mt-6 flex items-end gap-4">
        <p className="text-6xl font-bold leading-none text-gray-900 tabular-nums">
          {totalReviews > 0 ? averageRating.toFixed(1) : '—'}
        </p>
        <div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <StarIcon
                key={n}
                className={`h-6 w-6 ${n <= Math.round(averageRating) ? 'text-amber-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <p className="mt-2 text-base text-gray-500">
            {t(totalReviews === 1 ? 'reviews.stats.reviewCount' : 'reviews.stats.reviewCount_other', {
              count: totalReviews.toLocaleString(),
            })}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {[5, 4, 3, 2, 1].map((stars) => {
          const row = distributionByStar[stars] || { count: 0, percentage: 0 };
          return (
            <div key={stars} className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3">
              <div className="flex items-center gap-1 text-base font-medium text-gray-700">
                <span className="tabular-nums">{stars}</span>
                <StarIcon className="h-4 w-4 text-amber-400" />
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-emerald-50">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 tabular-nums whitespace-nowrap">
                {row.percentage}% ({row.count.toLocaleString()})
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
