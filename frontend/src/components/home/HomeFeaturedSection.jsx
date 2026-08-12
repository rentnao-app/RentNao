import { Link } from 'react-router-dom';
import ListingCard from '../ListingCard';
import { aosFadeUp, aosStagger } from '../../lib/aos';
import { homeSectionContentMt, homeSectionInner, homeSectionPy } from './homeLayout';
import { useTranslation } from '../../lib/i18n';

const HOME_FEATURED_COUNT = 6;

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
          <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-5 ${homeSectionContentMt}`}>
            {Array.from({ length: HOME_FEATURED_COUNT }, (_, k) => (
              <div key={k} className="h-full">
                <FeaturedCardSkeleton />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <p className={`py-12 text-center text-sm text-brand-muted ${homeSectionContentMt}`}>{t('home.noFeatured')}</p>
        ) : (
          <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-5 ${homeSectionContentMt}`}>
            {listings.slice(0, HOME_FEATURED_COUNT).map((listing, index) => (
              <div
                key={listing.listingId}
                className="h-full"
                {...aosFadeUp(aosStagger(index, 50))}
              >
                <ListingCard
                  item={listing}
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
