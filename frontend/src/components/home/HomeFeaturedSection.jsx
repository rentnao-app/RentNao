import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Heart,
  ImageIcon,
  MapPin,
  Maximize2,
} from 'lucide-react';
import { recordListingView } from '../../lib/listingViews';
import { aosFadeUp, aosStagger } from '../../lib/aos';
import { homeSectionContentMt, homeSectionInner, homeSectionPy } from './homeLayout';
import { useTranslation } from '../../lib/i18n';

const HOME_FEATURED_DESKTOP_COUNT = 8;
const HOME_FEATURED_MOBILE_COUNT = 6;

function SpecIcon({ children }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#E8F4EE] text-[#2A7D4F]">
      {children}
    </span>
  );
}

function PlaceholderImage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E8F4EE] to-[#f4faf6]">
      <ImageIcon className="h-11 w-11 text-[#2A7D4F]/30" strokeWidth={1.5} aria-hidden />
    </div>
  );
}

function formatAreaName(areaName, t) {
  if (!areaName) return '';
  return t(`common.areas.${areaName}`, String(areaName).replaceAll('_', ' '));
}

function HomeFeaturedListingCard({
  item,
  showFeaturedBadge = false,
  canWishlist = false,
  isWishlisted = false,
  onToggleWishlist,
  onViewCountUpdate,
}) {
  const { t } = useTranslation();
  const listingId = item?.listingId;
  const imageUrl = item?.primaryImageUrl || null;
  const title = item?.title
    ? `${item.title.slice(0, 52)}${item.title.length > 52 ? '…' : ''}`
    : t('components.listingCard.fallbackTitle', { beds: item?.roomCount ?? '?' });
  const rent = Number(item?.rent || 0).toLocaleString();
  const beds = item?.roomCount ?? '?';
  const baths = item?.bathroomCount ?? '?';
  const size = item?.propertySizeSqft ?? '?';
  const area = formatAreaName(item?.areaName, t);
  const location = area ? `${area}, ${t('home.locationCity')}` : t('home.locationCity');
  const viewCount = Number(item?.viewCount ?? 0);

  const handleNavigate = () => {
    if (!listingId) return;
    onViewCountUpdate?.(listingId, viewCount + 1);
    void recordListingView(listingId).then((nextCount) => {
      if (nextCount != null) onViewCountUpdate?.(listingId, nextCount);
    });
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-[#dfece4] transition duration-300 hover:-translate-y-1 hover:ring-[#2A7D4F]/25 hover:shadow-[0_16px_40px_-12px_rgba(42,125,79,0.2)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-[#E8F4EE]">
        <Link to={`/listings/${listingId}`} onClick={handleNavigate} className="block h-full w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item?.title || t('components.listingCard.propertyAlt')}
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <PlaceholderImage />
          )}
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a4728]/70 via-[#1a4728]/10 to-[#1a4728]/10" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
          <div className="flex flex-wrap gap-1.5">
            {showFeaturedBadge ? (
              <span className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c2410c] shadow-sm">
                {t('home.badgeFeatured')}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {canWishlist ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleWishlist?.(item);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm transition hover:scale-105 ${
                  isWishlisted ? 'text-rose-500' : 'text-[#8fa898] hover:text-[#2A7D4F]'
                }`}
                aria-label={
                  isWishlisted
                    ? t('components.listingCard.removeFromWishlist')
                    : t('components.listingCard.addToWishlist')
                }
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={2} />
              </button>
            ) : null}

            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#2A7D4F] shadow-sm backdrop-blur-sm">
              <BadgeCheck className="h-3 w-3" strokeWidth={2.25} aria-hidden />
              {t('home.verifiedBadge')}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3.5 pt-10">
          <p className="text-[1.35rem] font-bold leading-none tracking-tight text-white">
            ৳ {rent}
            <span className="ml-1.5 text-sm font-medium text-white/75">{t('home.perMonthShort')}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3.5 py-3 sm:px-4">
        <h3 className="line-clamp-2 text-[0.875rem] font-bold leading-tight text-brand-ink sm:text-[0.9375rem]">
          {title}
        </h3>

        <div className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug sm:text-xs">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#2A7D4F]" strokeWidth={2} aria-hidden />
          <p className="min-w-0">
            <span className="font-medium text-brand-muted">{t('home.propertyLocation')}: </span>
            <span className="text-brand-ink">{location}</span>
          </p>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-1.5 rounded-lg bg-[#f6fbf8] px-1.5 py-1.5">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <SpecIcon>
              <BedDouble className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </SpecIcon>
            <span className="text-[11px] font-semibold leading-none text-brand-ink">{beds}</span>
            <span className="text-[9px] text-brand-muted">{t('home.bedsLabel')}</span>
          </div>
          <div className="h-8 w-px bg-[#dfece4]" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <SpecIcon>
              <Bath className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </SpecIcon>
            <span className="text-[11px] font-semibold leading-none text-brand-ink">{baths}</span>
            <span className="text-[9px] text-brand-muted">{t('home.bathsLabel')}</span>
          </div>
          <div className="h-8 w-px bg-[#dfece4]" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <SpecIcon>
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </SpecIcon>
            <span className="text-[11px] font-semibold leading-none text-brand-ink">{size}</span>
            <span className="text-[9px] text-brand-muted">{t('home.sqftUnit')}</span>
          </div>
        </div>

        <Link
          to={`/listings/${listingId}`}
          onClick={handleNavigate}
          className="mt-2.5 flex h-9 items-center justify-center rounded-lg bg-[#2A7D4F] text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(42,125,79,0.55)] transition hover:bg-[#246341]"
        >
          {t('home.viewDetails')}
        </Link>
      </div>
    </article>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-[#dfece4]">
      <div className="aspect-[5/4] animate-pulse bg-[#E8F4EE]" />
      <div className="space-y-2 px-3.5 py-3">
        <div className="h-3.5 w-full animate-pulse rounded bg-[#f0f7f3]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#f0f7f3]" />
        <div className="h-14 animate-pulse rounded-lg bg-[#f6fbf8]" />
        <div className="h-9 animate-pulse rounded-lg bg-[#E8F4EE]" />
      </div>
    </div>
  );
}

export default function HomeFeaturedSection({
  listings,
  loading,
  canWishlist,
  wishlistIds,
  onToggleWishlist,
  onViewCountUpdate,
}) {
  const { t } = useTranslation();

  return (
    <section className={`bg-[#fafcfb] ${homeSectionPy}`} aria-labelledby="home-featured-heading">
      <div className={homeSectionInner}>
        <header className="mx-auto max-w-2xl text-center" {...aosFadeUp()}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A7D4F] sm:text-[0.8125rem]">
            {t('home.featuredEyebrow')}
          </p>
          <h2 id="home-featured-heading" className="mt-3 text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
            {t('home.featuredTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">{t('home.featuredSubtitle')}</p>
        </header>

        {loading ? (
          <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5 ${homeSectionContentMt}`}>
            {Array.from({ length: HOME_FEATURED_DESKTOP_COUNT }, (_, k) => (
              <div key={k} className={`h-full ${k >= HOME_FEATURED_MOBILE_COUNT ? 'hidden md:block' : ''}`}>
                <FeaturedCardSkeleton />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <p className={`py-12 text-center text-sm text-brand-muted ${homeSectionContentMt}`}>{t('home.noFeatured')}</p>
        ) : (
          <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5 ${homeSectionContentMt}`}>
            {listings.slice(0, HOME_FEATURED_DESKTOP_COUNT).map((listing, index) => (
              <div
                key={listing.listingId}
                className={`h-full ${index >= HOME_FEATURED_MOBILE_COUNT ? 'hidden md:block' : ''}`}
                {...aosFadeUp(aosStagger(index, 50))}
              >
                <HomeFeaturedListingCard
                  item={listing}
                  showFeaturedBadge={index === 0}
                  canWishlist={canWishlist}
                  isWishlisted={wishlistIds.has(String(listing.listingId))}
                  onToggleWishlist={onToggleWishlist}
                  onViewCountUpdate={onViewCountUpdate}
                />
              </div>
            ))}
          </div>
        )}

        <div className={`flex justify-center ${homeSectionContentMt}`} {...aosFadeUp(120)}>
          <Link
            to="/listings"
            className="inline-flex h-11 min-w-[11rem] items-center justify-center gap-2 rounded-full bg-[#2A7D4F] px-7 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(42,125,79,0.55)] transition hover:bg-[#246341] sm:min-w-[12.5rem] sm:px-8 sm:text-base"
          >
            {t('home.viewAll')}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
