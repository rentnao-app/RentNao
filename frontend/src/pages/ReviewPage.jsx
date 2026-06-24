import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppHeader from '../components/AppHeader';
import ReviewStatsPanel from '../components/ReviewStatsPanel';
import { useTranslation } from '../lib/i18n';
import {
  apiFetch,
  fetchProfileStatus,
  getAccessToken,
  getApiErrorMessage,
  getCurrentUser,
  getRefreshToken,
  getRequestErrorMessage,
  getUserId,
  isLoggedIn,
  setAuthSession,
} from '../lib/api';

const PAGE_SIZE = 12;
const MIN_CONTENT = 10;
const MAX_CONTENT = 1000;

const STATUS_BADGE_TONES = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  FLAGGED: 'bg-rose-50 text-rose-700 border-rose-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-gray-100 text-gray-600 border-gray-200',
  ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200',
};

function getStatusBadge(status, t) {
  const key = `reviews.status.${status}`;
  const label = t(key);
  return {
    label: label !== key ? label : status,
    tone: STATUS_BADGE_TONES[status] || STATUS_BADGE_TONES.APPROVED,
  };
}

function localCacheKey(userId) {
  return userId ? `rentnao_my_review_${userId}` : null;
}

function readLocalReview(userId) {
  const key = localCacheKey(userId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalReview(userId, review) {
  const key = localCacheKey(userId);
  if (!key) return;
  try {
    if (review) {
      localStorage.setItem(key, JSON.stringify(review));
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore quota / disabled storage
  }
}

export default function ReviewPage() {
  const { t } = useTranslation();
  const loggedIn = isLoggedIn();
  const user = useMemo(() => getCurrentUser(), []);
  const userId = getUserId(user);
  /** Live KYC from server — localStorage user is only updated at login and goes stale after admin approval. */
  const [kycGate, setKycGate] = useState(() =>
    !loggedIn ? 'guest' : 'loading'
  );
  const kycApproved = kycGate === 'approved';

  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState('');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [myReview, setMyReview] = useState(() => (userId ? readLocalReview(userId) : null));
  const [editing, setEditing] = useState(false);

  const fetchReviews = useCallback(
    async (nextPage) => {
      const isFirstPage = nextPage === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const res = await apiFetch(`/testimonials?page=${nextPage}&limit=${PAGE_SIZE}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok || body?.success === false) {
          throw new Error(getApiErrorMessage(body, t('reviews.errors.loadReviews')));
        }
        const items = Array.isArray(body?.data) ? body.data : [];
        const pagination = body?.pagination || {};

        setReviews((prev) => (isFirstPage ? items : [...prev, ...items]));
        setTotalPages(pagination.totalPages || 1);
        setListError('');

        if (userId) {
          const mine = items.find((t) => t.userId === userId);
          if (mine) {
            setMyReview(mine);
            writeLocalReview(userId, mine);
          }
        }
      } catch (err) {
        setListError(getRequestErrorMessage(err, t('reviews.errors.loadReviews')));
      } finally {
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [userId, t]
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch('/testimonials/stats');
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.success === false) {
        throw new Error(getApiErrorMessage(body, t('reviews.errors.loadStats')));
      }
      setStats(body?.data || null);
      setStatsError('');
    } catch (err) {
      setStatsError(getRequestErrorMessage(err, t('reviews.errors.loadStats')));
    } finally {
      setStatsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!loggedIn || !userId) {
      setKycGate('guest');
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const { res, body, data } = await fetchProfileStatus(userId);
      if (cancelled) return;

      if (!res.ok) {
        const fromCache =
          (getCurrentUser()?.kycVerificationStatus ||
            getCurrentUser()?.kyc_verification_status ||
            '') === 'APPROVED';
        setKycGate(fromCache ? 'approved' : 'blocked');
        return;
      }

      const kycRaw = data?.kycVerificationStatus ?? data?.kyc_verification_status ?? '';
      const approved = String(kycRaw).toUpperCase() === 'APPROVED';
      setKycGate(approved ? 'approved' : 'blocked');

      const current = getCurrentUser();
      if (current) {
        const merged = {
          ...current,
          kycVerificationStatus: kycRaw || current.kycVerificationStatus,
          kyc_verification_status: kycRaw || current.kyc_verification_status,
          onboardingStatus: data?.onboardingStatus ?? data?.onboarding_status ?? current.onboardingStatus,
          onboarding_status: data?.onboarding_status ?? current.onboarding_status,
          role: data?.role ?? current.role,
        };
        setAuthSession({
          accessToken: getAccessToken() || undefined,
          refreshToken: getRefreshToken() || undefined,
          user: merged,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loggedIn, userId]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReviews(next);
  };

  const handleSubmitted = (submitted) => {
    setMyReview(submitted);
    if (userId) writeLocalReview(userId, submitted);
    setEditing(false);
    setPage(1);
    fetchReviews(1);
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 mb-2">
            {t('reviews.badge')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {t('reviews.title')}
          </h1>
          <p className="mt-3 text-base text-gray-600 max-w-2xl">
            {t('reviews.subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-8 lg:items-start">
          <section className="max-w-2xl lg:col-start-1 lg:row-start-1">
            <ComposerCard
              loggedIn={loggedIn}
              kycGate={kycGate}
              kycApproved={kycApproved}
              myReview={myReview}
              editing={editing}
              onStartEdit={() => setEditing(true)}
              onCancelEdit={() => setEditing(false)}
              onSubmitted={handleSubmitted}
            />
          </section>

          <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
            <ReviewStatsPanel
              stats={stats}
              loading={statsLoading}
              error={statsError}
              onRetry={fetchStats}
            />
          </aside>

          <section className="lg:col-start-1 lg:row-start-2">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('reviews.all.title')}</h2>
              {!loading && reviews.length > 0 ? (
                <p className="text-xs sm:text-sm text-gray-500">
                  {reviews.length === 1
                    ? t('reviews.all.showingCount', { n: reviews.length })
                    : t('reviews.all.showingCount_other', { n: reviews.length })}
                </p>
              ) : null}
            </div>

            {loading ? (
              <ReviewSkeletonGrid />
            ) : listError ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
                {listError}{' '}
                <button
                  type="button"
                  className="ml-1 font-semibold underline hover:text-rose-900"
                  onClick={() => fetchReviews(1)}
                >
                  {t('common.tryAgain')}
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <EmptyReviews />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {reviews.map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      isMine={!!userId && r.userId === userId}
                    />
                  ))}
                </div>
                {page < totalPages ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingMore ? t('reviews.loadingMore') : t('reviews.loadMore')}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ComposerCard({
  loggedIn,
  kycGate,
  kycApproved,
  myReview,
  editing,
  onStartEdit,
  onCancelEdit,
  onSubmitted,
}) {
  const { t } = useTranslation();

  if (!loggedIn) {
    return (
      <PromptCard
        title={t('reviews.composer.title')}
        description={t('reviews.composer.signInDescription')}
        actions={
          <>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
            >
              {t('header.login')}
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition"
            >
              {t('reviews.composer.createAccount')}
            </Link>
          </>
        }
      />
    );
  }

  if (kycGate === 'loading') {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mt-3 h-3 w-full max-w-md animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-3 w-[66%] max-w-sm animate-pulse rounded bg-gray-100" />
        <p className="mt-4 text-xs text-gray-500">{t('reviews.composer.checkingKyc')}</p>
      </div>
    );
  }

  if (!kycApproved) {
    return (
      <PromptCard
        tone="warning"
        title={t('reviews.composer.kycRequiredTitle')}
        description={t('reviews.composer.kycRequiredBody')}
        actions={
          <Link
            to="/verification-holding"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            {t('reviews.composer.goToVerification')}
          </Link>
        }
      />
    );
  }

  if (myReview && !editing) {
    return <MyReviewCard review={myReview} onEdit={onStartEdit} />;
  }

  return (
    <ReviewForm
      initial={editing ? myReview : null}
      isEdit={editing}
      onCancel={editing ? onCancelEdit : null}
      onSubmitted={onSubmitted}
    />
  );
}

function ReviewForm({ initial, isEdit, onCancel, onSubmitted }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initial?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(initial?.content || '');
  const [submitting, setSubmitting] = useState(false);

  const trimmed = content.trim();
  const valid = trimmed.length >= MIN_CONTENT && trimmed.length <= MAX_CONTENT && rating >= 1 && rating <= 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, rating }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.success === false) {
        throw new Error(getApiErrorMessage(body, t('reviews.toast.submitFailed')));
      }
      const created = body?.data;
      toast.success(t('reviews.toast.submitted'));
      onSubmitted?.(created);
    } catch (err) {
      toast.error(getRequestErrorMessage(err, t('reviews.toast.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          {isEdit ? t('reviews.form.editTitle') : t('reviews.composer.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('reviews.form.helpText')}
        </p>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-800 mb-2">{t('reviews.form.ratingLabel')}</label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= (hoverRating || rating);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="rounded-md p-1 transition hover:scale-110"
                aria-label={n === 1 ? t('reviews.form.starAria', { n }) : t('reviews.form.starAria_other', { n })}
              >
                <StarIcon className={`h-8 w-8 ${filled ? 'text-amber-400' : 'text-gray-300'}`} filled={filled} />
              </button>
            );
          })}
          <span className="ml-2 text-sm font-medium text-gray-700 tabular-nums">{rating}/5</span>
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="review-content" className="block text-sm font-semibold text-gray-800 mb-2">
          {t('reviews.form.contentLabel')}
        </label>
        <textarea
          id="review-content"
          rows={5}
          maxLength={MAX_CONTENT}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('reviews.form.placeholder')}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
        />
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span
            className={
              trimmed.length > 0 && trimmed.length < MIN_CONTENT
                ? 'text-rose-600'
                : 'text-gray-500'
            }
          >
            {trimmed.length < MIN_CONTENT
              ? t('reviews.form.minChars', { n: MIN_CONTENT })
              : t('reviews.form.looksGood')}
          </span>
          <span className="text-gray-400 tabular-nums">
            {content.length}/{MAX_CONTENT}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {t('reviews.form.cancel')}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!valid || submitting}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('reviews.form.submitting') : isEdit ? t('reviews.form.saveChanges') : t('reviews.form.submit')}
        </button>
      </div>
    </form>
  );
}

function MyReviewCard({ review, onEdit }) {
  const { t } = useTranslation();
  const status = String(review?.status || 'APPROVED').toUpperCase();
  const badge = getStatusBadge(status, t);
  const showStatusBadge = status !== 'APPROVED';

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{t('reviews.myReview.title')}</p>
          <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">
            {t('reviews.myReview.thanks')}
          </h2>
        </div>
        {showStatusBadge ? (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.tone}`}
          >
            {badge.label}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            {t('reviews.myReview.visible')}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-1">
        <StarRow rating={review.rating} />
        <span className="ml-2 text-sm font-semibold text-gray-700 tabular-nums">
          {review.rating}/5
        </span>
      </div>

      <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
        {review.content}
      </p>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {t('common.edit')}
        </button>
      </div>
    </div>
  );
}

function PromptCard({ title, description, actions, tone = 'info' }) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50'
      : 'border-emerald-100 bg-white';
  return (
    <div className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${toneClass}`}>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1.5 text-sm text-gray-700 max-w-xl">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function ReviewCard({ review, isMine }) {
  const { t } = useTranslation();
  const name = review?.user?.displayName || t('reviews.card.anonymous');
  const dateText = formatDate(review?.createdAt, t);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        isMine ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={name} src={review?.user?.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {name}
            {isMine ? (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                {t('reviews.card.you')}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-gray-500">{dateText}</p>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-0.5">
        <StarRow rating={review.rating} small />
      </div>

      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
        {review.content}
      </p>

      {review.isFeatured ? (
        <p className="mt-auto pt-3 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          {t('reviews.card.featured')}
        </p>
      ) : null}
    </article>
  );
}

function EmptyReviews() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118L2.077 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 0 0 .95-.69l1.519-4.673z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-900">{t('reviews.empty.title')}</p>
      <p className="mt-1 text-sm text-gray-600">{t('reviews.empty.body')}</p>
    </div>
  );
}

function ReviewSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              <div className="h-2.5 w-1/3 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-2.5 w-11/12 animate-pulse rounded bg-gray-100" />
            <div className="h-2.5 w-9/12 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function isHttpUrl(s) {
  if (!s || typeof s !== 'string') return false;
  return /^https?:\/\//i.test(s.trim());
}

function Avatar({ name, src }) {
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    setImgErr(false);
  }, [src]);

  const showImg = isHttpUrl(src) && !imgErr;

  if (showImg) {
    return (
      <img
        src={src}
        alt=""
        className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-100"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 ring-1 ring-gray-100">
      {getInitials(name)}
    </div>
  );
}

function StarRow({ rating, small = false }) {
  const size = small ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rating;
        return (
          <StarIcon
            key={n}
            className={`${size} ${filled ? 'text-amber-400' : 'text-gray-200'}`}
            filled={filled}
          />
        );
      })}
    </div>
  );
}

function StarIcon({ className = 'h-5 w-5', filled = true }) {
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

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const w = parts[0];
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : `${w[0]}`.toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(iso, t) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now - d;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return t('common.time.today');
  if (diffMs < 2 * day) return t('common.time.yesterday');
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return days === 1
      ? t('common.time.daysAgo', { d: days })
      : t('common.time.daysAgo_other', { d: days });
  }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
