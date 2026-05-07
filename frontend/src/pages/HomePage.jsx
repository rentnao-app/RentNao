import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch, getCurrentUser, isLoggedIn } from '../lib/api';
import { getWishlistState, toggleWishlist } from '../lib/wishlist';
import PropertySearchBar from '../components/PropertySearchBar';
import AppHeader from '../components/AppHeader';
const hero = '/hero-image.png';
const HERO_TEXT_FONT = 'Avenir, "Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif';

function FeaturedCard({ listing, canWishlist, isWishlisted, onToggleWishlist }) {
  const imageUrl = listing?.primaryImageUrl || null;
  return (
    <div className="relative bg-white rounded-xl border border-green-100 shadow-sm hover:shadow-md transition overflow-hidden group">
      {canWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(listing);
          }}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center hover:bg-white"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className={`w-5 h-5 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-500'}`} viewBox="0 0 24 24">
            <path d="M12.001 20.729l-1.09-.992C6.14 15.39 3 12.548 3 9.06 3 6.219 5.24 4 8.05 4c1.59 0 3.115.74 4.05 1.9C13.835 4.74 15.36 4 16.95 4 19.76 4 22 6.219 22 9.06c0 3.488-3.14 6.33-7.91 10.677l-1.089.992z" />
          </svg>
        </button>
      )}
      <Link to={`/listings/${listing.listingId}`} className="block">
        <div className="h-40 sm:h-44 bg-gradient-to-br from-[#dcefdc] to-[#b7ddba] overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={listing.title || 'Property'} className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-14 h-14 text-[#5b9b61]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l9-8 9 8v8a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8z"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 truncate">{listing.title || 'Featured Property'}</h3>
          <p className="text-[#2f8444] font-bold mt-1">BDT {Number(listing.rent || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500">/Month</p>
        </div>
      </Link>
    </div>
  );
}

function StatCard({ icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-[0_8px_24px_rgba(22,101,52,0.10)] px-4 py-4 flex items-center gap-5 hover:shadow-[0_10px_30px_rgba(22,101,52,0.14)] transition">
      <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
        {icon}
      </div>
      <div>
        <p className="font-semibold mb-1 text-gray-800 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || currentUser?.userRole;
  const canWishlist = loggedIn && userRole === 'TENANT';
  const [wishlistIds, setWishlistIds] = useState(new Set());

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

  useEffect(() => {
    const timer = setTimeout(() => {
      void getWishlistState().then((state) => setWishlistIds(state.ids));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="min-h-screen bg-[#f5faf5] text-gray-800">
      <AppHeader />

      <section className="relative overflow-visible bg-[#eef7ef] border-b border-[#ddeee1]">
        <div className="relative w-full">
          <img
            src={hero}
            alt="Happy couple with rented home"
            className="w-full h-[440px] sm:h-[460px] md:h-[500px] lg:h-[400px] object-cover object-[60%_center] sm:object-[58%_center] md:object-center lg:object-center brightness-110 saturate-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/62 via-white/34 to-transparent sm:from-white/48 sm:via-white/28 md:from-white/40 md:via-white/24 lg:from-white/35 lg:via-white/20" />
          <div className="pointer-events-none absolute inset-0 z-[19] flex items-start lg:items-center">
            <div className="pointer-events-auto max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 md:pt-16 lg:pt-0 flex flex-col justify-start lg:justify-center gap-3 sm:gap-4 md:gap-5 lg:block">
              <h1
                className="text-[1.8rem] sm:text-[2.4rem] md:text-5xl lg:text-5xl font-bold leading-[1.15] sm:leading-tight text-[#1e4732] max-w-[19rem] sm:max-w-xl lg:max-w-2xl"
                style={{ fontFamily: HERO_TEXT_FONT }}
              >
                Find Your Perfect Home,
                <br className="hidden sm:block" />
                No Brokers Needed
              </h1>
              <p
                className="text-sm sm:text-base md:text-lg text-[#38684a] max-w-[19rem] sm:max-w-xl lg:max-w-2xl lg:mt-5"
                style={{ fontFamily: HERO_TEXT_FONT }}
              >
                Connecting Owners &amp; Tenants Directly in Bangladesh.
              </p>
              <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-6 w-full max-w-2xl md:max-w-xl lg:max-w-2xl">
                <PropertySearchBar variant="hero" navigateOnSubmit />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#1e4732]/5 to-transparent" />
        <div className="h-12 sm:h-14 md:h-16 lg:h-8" />
      </section>

      <section className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10 md:mt-2 lg:mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="-mt-8 sm:mt-0">
            <StatCard
              title="Verified Listings"
              subtitle="Safe & Trusted Properties"
              icon={
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
                </svg>
              }
            />
          </div>
          <StatCard
            title="Tenant Verification"
            subtitle="Background checks for peace of mind"
            icon={
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a5 5 0 015 5v2h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V7a5 5 0 015-5zm3 9H9v8h6v-8zm-3-7a3 3 0 00-3 3v2h6V7a3 3 0 00-3-3z" />
              </svg>
            }
          />
          <StatCard
            title="Rent Agreements"
            subtitle="Legal contracts made easy"
            icon={
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6zm1 7V4.5L18.5 9H15zM8 12h8v1.8H8V12zm0 3.5h8v1.8H8v-1.8z" />
              </svg>
            }
          />
          <StatCard
            title="Rent Collection"
            subtitle="Hassle-free payment management"
            icon={
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 6h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2zm2 3v6h14V9H5zm10 2h4v2h-4v-2z" />
              </svg>
            }
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[#2f8444]">Featured Properties</h2>
          <p className="text-gray-600 mt-1">Popular Listings in Your Area</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2f8444]"></div>
          </div>
        ) : listings.length === 0 ? (
          <p className="text-center py-10 text-gray-500">No featured properties available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <FeaturedCard
                key={listing.listingId}
                listing={listing}
                canWishlist={canWishlist}
                isWishlisted={wishlistIds.has(String(listing.listingId))}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 lg:pb-12">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-[#2f8444] via-[#2a7a3f] to-[#1f5f31] text-white shadow-[0_12px_30px_rgba(31,95,49,0.22)] px-4 py-3 sm:px-6 sm:py-4 text-center">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-[#9bd5a8]/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-emerald-50">
              <svg className="h-3 w-3 text-emerald-100" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 11L12 4L20 11V20H14V14H10V20H4V11Z" fill="currentColor" />
              </svg>
              Verified homes, trusted people
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-snug">
                Rent smarter with trusted listings and verified users across Rent Nao.
              </h3>
              <p className="mt-0.5 text-xs sm:text-[13px] text-emerald-100/90">
                Find or list a home and manage everything in one place.
              </p>
            </div>

            {!loggedIn && (
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="inline-flex items-center justify-center rounded-lg bg-white text-[#1f5f31] font-semibold px-3.5 py-1.5 text-xs sm:text-sm shadow-md shadow-[#153f23]/20 hover:bg-[#f3fff5] transition"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

