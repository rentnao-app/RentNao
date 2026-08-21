import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Eye,
  Heart,
  ImageIcon,
  MapPin,
  Maximize2,
} from 'lucide-react';
import { recordListingView } from '../lib/listingViews';
import { useTranslation } from '../lib/i18n';

const LATEST_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function isLatestListing(createdAt) {
  if (!createdAt) return false;
  const ts = new Date(createdAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= LATEST_WINDOW_MS;
}

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

export default function ListingCard({
  item,
  canWishlist = false,
  isWishlisted = false,
  onToggleWishlist,
  onViewCountUpdate,
  showArea = false,
  variant = 'default',
  layout = 'grid',
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
  const showLatestBadge = isLatestListing(item?.createdAt);
  const listedOn = item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
  void showArea;
  void variant;
  void layout;

  const handleNavigate = () => {
    if (!listingId) return;
    onViewCountUpdate?.(listingId, viewCount + 1);
    void recordListingView(listingId).then((nextCount) => {
      if (nextCount != null) onViewCountUpdate?.(listingId, nextCount);
    });
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-[#dfece4] shadow-[0_1px_2px_rgba(26,71,40,0.04)] transition-[transform,box-shadow,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-2 hover:ring-[#2A7D4F]/30 hover:shadow-[0_22px_44px_-18px_rgba(42,125,79,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[5/4] overflow-hidden bg-[#E8F4EE]">
        <Link to={`/listings/${listingId}`} onClick={handleNavigate} className="block h-full w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item?.title || t('components.listingCard.propertyAlt')}
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <PlaceholderImage />
          )}
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a4728]/70 via-[#1a4728]/10 to-[#1a4728]/10 transition-opacity duration-500 group-hover:from-[#1a4728]/78" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
          <div className="flex flex-wrap gap-1.5">
            {showLatestBadge ? (
              <span className="rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#047857] shadow-sm ring-1 ring-[#a7f3d0]/80">
                {t('home.badgeLatest')}
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 pt-10">
          <p className="min-w-0 text-[1.35rem] font-bold leading-none tracking-tight text-white">
            ৳ {rent}
            <span className="ml-1.5 text-sm font-medium text-white/75">{t('home.perMonthShort')}</span>
          </p>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm sm:text-[11px]"
            title={t('components.listingCard.propertyViewed', { count: viewCount.toLocaleString() })}
          >
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.25} aria-hidden />
            <span>{viewCount.toLocaleString()}</span>
            <span className="font-medium text-white/80">{t('home.viewsLabel')}</span>
          </span>
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

        {listedOn ? (
          <p className="mt-1.5 text-center text-[10px] text-brand-muted">
            {t('components.listingCard.listedOn', { date: listedOn })}
          </p>
        ) : null}

        <Link
          to={`/listings/${listingId}`}
          onClick={handleNavigate}
          className="mt-2.5 flex h-9 items-center justify-center rounded-lg bg-[#2A7D4F] text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(42,125,79,0.55)] transition-[background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#246341] group-hover:shadow-[0_8px_18px_-6px_rgba(42,125,79,0.55)] motion-reduce:transition-none"
        >
          {t('components.listingCard.viewDetails')}
        </Link>
      </div>
    </article>
  );
}
