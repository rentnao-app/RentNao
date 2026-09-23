import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch, AUTH_UPDATE_EVENT, getCurrentUser, getUserId, isLoggedIn } from '../lib/api';
import { getWishlistState, toggleWishlist } from '../lib/wishlist';
import AppHeader from '../components/AppHeader';
import HomeHeroSection from '../components/home/HomeHeroSection';
import HomeWhySection from '../components/home/HomeWhySection';
import HomeFeaturedSection from '../components/home/HomeFeaturedSection';
import HomeComparisonSection from '../components/home/HomeComparisonSection';
import HomePaymentsSection from '../components/home/HomePaymentsSection';
import HomeCTASection from '../components/home/HomeCTASection';
import { homeSectionContentMt, homeSectionInner, homeSectionPy } from '../components/home/homeLayout';
import { useHomeAos } from '../hooks/useHomeAos';
import { aosFadeUp, aosStagger } from '../lib/aos';
import { useTranslation } from '../lib/i18n';

function isHttpUrl(s) {
  if (!s || typeof s !== 'string') return false;
  return /^https?:\/\//i.test(s.trim());
}

function reviewerInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatReviewDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function excerpt(text, max) {
  const t = (text || '').trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function HomeReviewStars({ rating }) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${n <= r ? 'text-amber-400' : 'text-gray-200'}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function HomeReviewAvatar({ name, src }) {
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
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-100"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 ring-1 ring-gray-100">
      {reviewerInitials(name)}
    </div>
  );
}

function HomeTopReviewCard({ review, aosDelay = 0 }) {
  const name = review?.user?.displayName || 'Community member';
  const body = excerpt(review?.content || '', 120);
  const dateText = formatReviewDate(review?.createdAt);
  const rating = Number(review?.rating) || 0;

  return (
    <Link
      to="/review"
      {...aosFadeUp(aosDelay)}
      className="group flex h-full min-h-0 flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8444]"
    >
      <div className="mb-3 flex items-start gap-3">
        <HomeReviewAvatar name={name} src={review?.user?.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          {dateText ? <p className="text-xs text-gray-500">{dateText}</p> : null}
        </div>
      </div>
      <div className="mb-2">
        <HomeReviewStars rating={rating} />
      </div>
      <p className="text-sm leading-relaxed text-gray-700 line-clamp-4">{body}</p>
      <span className="mt-3 text-xs font-semibold text-[#2f8444] group-hover:underline">Read more</span>
    </Link>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topReviews, setTopReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  /** null while checking for logged-in users; ignored for guests */
  const [hasMyReview, setHasMyReview] = useState(null);
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || currentUser?.userRole;
  const canWishlist = loggedIn && userRole === 'TENANT';
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useHomeAos([loading, reviewsLoading, listings.length, topReviews.length]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const res = await apiFetch('/properties/public/listings?limit=6');
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          setListings(body?.data?.items || []);
        }
      } catch {
        // no-op
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  const loadTopReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await apiFetch('/testimonials?page=1&limit=3');
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.success !== false) {
        setTopReviews(Array.isArray(body?.data) ? body.data : []);
      } else {
        setTopReviews([]);
      }
    } catch {
      setTopReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTopReviews();
  }, [loadTopReviews]);

  const loadMyReviewFlag = useCallback(async () => {
    if (!isLoggedIn()) {
      setHasMyReview(null);
      return;
    }
    const uid = getUserId(getCurrentUser());
    if (!uid) {
      setHasMyReview(false);
      return;
    }
    try {
      const res = await apiFetch('/testimonials/me');
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.success && typeof body?.data?.hasReview === 'boolean') {
        setHasMyReview(body.data.hasReview);
      } else {
        setHasMyReview(false);
      }
    } catch {
      setHasMyReview(false);
    }
  }, []);

  useEffect(() => {
    void loadMyReviewFlag();
  }, [loadMyReviewFlag, loggedIn]);

  useEffect(() => {
    const onAuth = () => {
      void loadMyReviewFlag();
    };
    window.addEventListener(AUTH_UPDATE_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_UPDATE_EVENT, onAuth);
  }, [loadMyReviewFlag]);

  const showGiveReviewCta = !loggedIn || hasMyReview === false;

  useEffect(() => {
    if (!canWishlist) {
      setWishlistIds(new Set());
      return undefined;
    }
    const timer = setTimeout(() => {
      void getWishlistState().then((state) => setWishlistIds(state.ids));
    }, 0);
    return () => clearTimeout(timer);
  }, [canWishlist]);

  const handleToggleWishlist = async (listing) => {
    const id = String(listing?.listingId || '');
    if (!id) return;
    const save = !wishlistIds.has(id);
    await toggleWishlist(listing, save);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (save) next.add(id);
      else next.delete(id);
      return next;
    });
    toast.success(save ? 'Saved to wishlist' : 'Removed from wishlist');
  };

  const handleViewCountUpdate = (listingId, viewCount) => {
    setListings((prev) =>
      prev.map((listing) =>
        listing.listingId === listingId ? { ...listing, viewCount } : listing
      )
    );
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#fafcfb] text-gray-800">
      <AppHeader centerNav />

      <HomeHeroSection />

      <HomeWhySection />

      <HomeFeaturedSection
        listings={listings}
        loading={loading}
        canWishlist={canWishlist}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onViewCountUpdate={handleViewCountUpdate}
      />

      <HomeComparisonSection />

      <HomePaymentsSection />

      <section className={`bg-[#fafcfb] ${homeSectionPy}`}>
        <div className={`${homeSectionInner} max-w-5xl`}>
          <div {...aosFadeUp()}>
            <h2 className="text-center text-xl font-bold text-[#1e4732] sm:text-2xl">{t('home.reviewsTitle')}</h2>
            <p className="mt-1 text-center text-sm text-gray-600">{t('home.reviewsSubtitle')}</p>
          </div>

          {reviewsLoading ? (
            <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 ${homeSectionContentMt}`}>
              {[0, 1, 2].map((k) => (
                <div
                  key={k}
                  className="animate-pulse rounded-2xl border border-emerald-50 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-2/3 max-w-[12rem] rounded bg-gray-100" />
                      <div className="h-2.5 w-1/3 max-w-[5rem] rounded bg-gray-100" />
                    </div>
                  </div>
                  <div className="mb-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-3.5 w-3.5 shrink-0 rounded bg-gray-100" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 w-full rounded bg-gray-100" />
                    <div className="h-2.5 w-[92%] rounded bg-gray-100" />
                    <div className="h-2.5 w-[78%] rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : topReviews.length === 0 ? (
            <p className={`text-center text-sm text-gray-500 ${homeSectionContentMt}`}>{t('home.reviewsEmpty')}</p>
          ) : (
            <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 ${homeSectionContentMt}`}>
              {topReviews.map((review, index) => (
                <HomeTopReviewCard key={review.id} review={review} aosDelay={aosStagger(index, 70)} />
              ))}
            </div>
          )}

          {showGiveReviewCta ? (
            <div className={`flex justify-center ${homeSectionContentMt}`} {...aosFadeUp(120)}>
              <Link
                to="/review"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                {t('home.giveReview')}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <HomeCTASection />

    </div>
  );
}

