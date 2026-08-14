import { Link } from 'react-router-dom';
import { recordListingView } from '../lib/listingViews';
import { useTranslation } from '../lib/i18n';

function EyeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M2.036 12.322a1 1 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BedIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12h18M3 7v10M21 7v10M7 12V9a2 2 0 012-2h6a2 2 0 012 2v3" />
    </svg>
  );
}

function BathIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 12h16M6 12V8a2 2 0 012-2h1M18 12V8a2 2 0 00-2-2h-1M8 20h8M12 12v8" />
    </svg>
  );
}

function SizeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4M9 9h6v6H9z" />
    </svg>
  );
}

function PinIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z" />
      <circle cx="12" cy="11" r="2.5" strokeWidth={1.75} />
    </svg>
  );
}

function PlaceholderImage({ className = 'h-14 w-14 text-emerald-300' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
      />
    </svg>
  );
}

function WishlistButton({ canWishlist, isWishlisted, onToggleWishlist, item, className = '' }) {
  const { t } = useTranslation();
  if (!canWishlist) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleWishlist?.(item);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-sm transition hover:bg-white ${className}`.trim()}
      aria-label={
        isWishlisted ? t('components.listingCard.removeFromWishlist') : t('components.listingCard.addToWishlist')
      }
    >
      <svg className={`h-5 w-5 ${isWishlisted ? 'fill-current text-rose-500' : 'text-slate-500'}`} viewBox="0 0 24 24">
        <path d="M12.001 20.729l-1.09-.992C6.14 15.39 3 12.548 3 9.06 3 6.219 5.24 4 8.05 4c1.59 0 3.115.74 4.05 1.9C13.835 4.74 15.36 4 16.95 4 19.76 4 22 6.219 22 9.06c0 3.488-3.14 6.33-7.91 10.677l-1.089.992z" />
      </svg>
    </button>
  );
}

function ListingBadges({ item, t }) {
  const badges = [{ key: 'verified', label: t('listingDetails.badges.verified'), tone: 'emerald' }];
  const tenantType = item?.intendedTenantType;
  if (tenantType && tenantType !== 'BOTH') {
    badges.push({
      key: 'tenant',
      label: t(`common.enums.tenantType.${tenantType}`, tenantType),
      tone: 'slate',
    });
  }

  if (badges.length === 0) return null;

  const toneClass = (tone) =>
    tone === 'emerald' ? 'bg-emerald-700/90 text-white' : 'bg-white/90 text-slate-700 ring-1 ring-slate-200/80';

  return (
    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm sm:text-[11px] ${toneClass(badge.tone)}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function BrowseListingCard({
  item,
  canWishlist,
  isWishlisted,
  onToggleWishlist,
  onViewCountUpdate,
  layout = 'grid',
}) {
  const { t } = useTranslation();
  const listingId = item?.listingId;
  const imageUrl = item?.primaryImageUrl || null;
  const areaKey = item?.areaName ? String(item.areaName) : '';
  const areaLabel = areaKey
    ? t(`common.areas.${areaKey}`, areaKey.replaceAll('_', ' '))
    : t('common.areaNotSpecified');
  const location = `${areaLabel}, ${t('listings.locationCity')}`;
  const title = item?.title
    ? `${item.title.slice(0, 56)}${item.title.length > 56 ? '...' : ''}`
    : t('components.listingCard.fallbackTitle', { beds: item?.roomCount ?? '?' });
  const rent = Number(item?.rent || 0).toLocaleString();
  const beds = item?.roomCount ?? '?';
  const baths = item?.bathroomCount ?? '?';
  const size = item?.propertySizeSqft ?? '?';
  const viewCount = Number(item?.viewCount ?? 0);
  const isList = layout === 'list';

  const handleCardClick = () => {
    if (!listingId) return;
    onViewCountUpdate?.(listingId, viewCount + 1);
    void recordListingView(listingId).then((nextCount) => {
      if (nextCount != null) onViewCountUpdate?.(listingId, nextCount);
    });
  };

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        isList ? 'flex flex-col sm:flex-row' : 'relative'
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 ${isList ? 'sm:w-72' : ''}`}>
        <WishlistButton
          canWishlist={canWishlist}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          item={item}
          className="absolute right-3 top-3 z-10"
        />
        <Link to={`/listings/${listingId}`} className="block" onClick={handleCardClick}>
          <div className={`flex items-center justify-center overflow-hidden ${isList ? 'h-48 sm:h-full sm:min-h-[12rem]' : 'h-48 sm:h-52'}`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item?.title || t('components.listingCard.propertyAlt')}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <PlaceholderImage />
            )}
          </div>
          <ListingBadges item={item} t={t} />
        </Link>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col p-4 sm:p-5 ${isList ? 'justify-center' : ''}`}>
        <Link to={`/listings/${listingId}`} className="block min-w-0 flex-1" onClick={handleCardClick}>
          <p className="text-xl font-bold text-slate-900 sm:text-[1.35rem]">
            ৳ {rent}
            <span className="ml-1 text-sm font-medium text-slate-500">{t('components.listingCard.perMonthShort')}</span>
          </p>
          <h2 className="mt-1.5 text-base font-bold text-slate-900 transition group-hover:text-emerald-800 sm:text-lg">{title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <PinIcon className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate">{location}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BedIcon className="h-4 w-4 text-emerald-700" />
              {beds}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BathIcon className="h-4 w-4 text-emerald-700" />
              {baths}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <SizeIcon className="h-4 w-4 text-emerald-700" />
              {size} {t('components.listingCard.sqft')}
            </span>
          </div>
        </Link>
        <Link
          to={`/listings/${listingId}`}
          onClick={handleCardClick}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
        >
          {t('components.listingCard.viewDetails')}
        </Link>
      </div>
    </article>
  );
}

function DefaultListingCard({ item, canWishlist, isWishlisted, onToggleWishlist, onViewCountUpdate, showArea }) {
  const { t } = useTranslation();
  const listingId = item?.listingId;
  const imageUrl = item?.primaryImageUrl || null;
  const area = item?.areaName ? String(item.areaName).replaceAll('_', ' ') : '';
  const title = item?.title
    ? `${item.title.slice(0, 56)}${item.title.length > 56 ? '...' : ''}`
    : t('components.listingCard.fallbackTitle', { beds: item?.roomCount ?? '?' });
  const rent = Number(item?.rent || 0).toLocaleString();
  const beds = item?.roomCount ?? '?';
  const baths = item?.bathroomCount ?? '?';
  const size = item?.propertySizeSqft ?? '?';
  const viewCount = Number(item?.viewCount ?? 0);
  const listedOn = item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';

  const handleCardClick = () => {
    if (!listingId) return;
    onViewCountUpdate?.(listingId, viewCount + 1);
    void recordListingView(listingId).then((nextCount) => {
      if (nextCount != null) onViewCountUpdate?.(listingId, nextCount);
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <WishlistButton
        canWishlist={canWishlist}
        isWishlisted={isWishlisted}
        onToggleWishlist={onToggleWishlist}
        item={item}
        className="absolute right-3 top-3 z-10 border-slate-200"
      />

      <Link to={`/listings/${listingId}`} className="block" onClick={handleCardClick}>
        <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 sm:h-48">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item?.title || t('components.listingCard.propertyAlt')}
              className="h-full w-full object-cover"
            />
          ) : (
            <PlaceholderImage />
          )}
        </div>

        <div className="space-y-1.5 p-4 sm:p-5">
          {showArea && area ? (
            <p className="text-right text-xs font-medium uppercase tracking-wide text-slate-400">{area}</p>
          ) : null}
          <h2 className="text-base font-bold text-slate-900 transition group-hover:text-emerald-800 sm:text-lg">{title}</h2>
          <p className="text-lg font-bold text-emerald-800">
            BDT {rent}
            <span className="ml-1 text-sm font-normal text-slate-500">{t('components.listingCard.perMonth')}</span>
          </p>
          <p className="text-base text-slate-600">{t('components.listingCard.specs', { beds, baths, size })}</p>
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <EyeIcon className="h-4 w-4 shrink-0" />
            <span>{t('components.listingCard.propertyViewed', { count: viewCount.toLocaleString() })}</span>
          </p>
          {listedOn ? (
            <p className="text-xs text-slate-400">{t('components.listingCard.listedOn', { date: listedOn })}</p>
          ) : null}
        </div>
      </Link>
    </div>
  );
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
  if (variant === 'browse') {
    return (
      <BrowseListingCard
        item={item}
        canWishlist={canWishlist}
        isWishlisted={isWishlisted}
        onToggleWishlist={onToggleWishlist}
        onViewCountUpdate={onViewCountUpdate}
        layout={layout}
      />
    );
  }

  return (
    <DefaultListingCard
      item={item}
      canWishlist={canWishlist}
      isWishlisted={isWishlisted}
      onToggleWishlist={onToggleWishlist}
      onViewCountUpdate={onViewCountUpdate}
      showArea={showArea}
    />
  );
}
