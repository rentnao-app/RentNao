import { Link } from 'react-router-dom';
import { recordListingView } from '../lib/listingViews';

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

export default function ListingCard({
  item,
  canWishlist = false,
  isWishlisted = false,
  onToggleWishlist,
  onViewCountUpdate,
  showArea = false,
}) {
  const listingId = item?.listingId;
  const imageUrl = item?.primaryImageUrl || null;
  const area = item?.areaName ? String(item.areaName).replaceAll('_', ' ') : '';
  const title = item?.title
    ? `${item.title.slice(0, 56)}${item.title.length > 56 ? '...' : ''}`
    : `Apartment - ${item?.roomCount ?? '?'} beds`;
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
      {canWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist?.(item);
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-sm transition hover:bg-white"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className={`h-5 w-5 ${isWishlisted ? 'fill-current text-rose-500' : 'text-slate-500'}`} viewBox="0 0 24 24">
            <path d="M12.001 20.729l-1.09-.992C6.14 15.39 3 12.548 3 9.06 3 6.219 5.24 4 8.05 4c1.59 0 3.115.74 4.05 1.9C13.835 4.74 15.36 4 16.95 4 19.76 4 22 6.219 22 9.06c0 3.488-3.14 6.33-7.91 10.677l-1.089.992z" />
          </svg>
        </button>
      )}

      <Link to={`/listings/${listingId}`} className="block" onClick={handleCardClick}>
        <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 sm:h-48">
          {imageUrl ? (
            <img src={imageUrl} alt={item?.title || 'Property'} className="h-full w-full object-cover" />
          ) : (
            <PlaceholderImage />
          )}
        </div>

        <div className="space-y-1.5 p-4 sm:p-5">
          {showArea && area ? (
            <p className="text-right text-xs font-medium uppercase tracking-wide text-slate-400">{area}</p>
          ) : null}
          <h2 className="text-base font-bold text-slate-900 transition group-hover:text-emerald-800 sm:text-lg">{title}</h2>
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-bold text-emerald-800">
              BDT {rent}
              <span className="ml-1 text-sm font-normal text-slate-500">/month</span>
            </p>
            <p className="flex shrink-0 items-center gap-1.5 text-sm text-slate-600">
              <EyeIcon className="h-4 w-4 shrink-0" />
              <span>
                Property Viewed {viewCount.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-base text-slate-600">
              {beds} Beds, {baths} Baths, {size} sqft
            </p>
            {listedOn ? (
              <p className="shrink-0 text-right text-xs text-slate-400">Listed on {listedOn}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  );
}
