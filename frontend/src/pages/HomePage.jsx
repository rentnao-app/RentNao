import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch, getCurrentUser, isLoggedIn } from '../lib/api';
import { getWishlistState, toggleWishlist } from '../lib/wishlist';
import PropertySearchBar from '../components/PropertySearchBar';
import BrandLogoLink, { BRAND_LOGO_IMG_CLASS_COMPACT } from '../components/BrandLogoLink';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || currentUser?.userRole;
  const unknownRole = loggedIn && !userRole;
  const showFindProperty = !loggedIn || userRole === 'TENANT' || userRole === 'ADMIN' || unknownRole;
  const showListProperty = !loggedIn || userRole === 'OWNER' || userRole === 'ADMIN' || unknownRole;
  const canWishlist = loggedIn && userRole === 'TENANT';
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const dashboardPath =
    userRole === 'ADMIN'
      ? '/admin-dashboard'
      : userRole === 'OWNER'
        ? '/owner-dashboard'
        : '/tenant-dashboard';

  useEffect(() => {
    const loadListings = async () => {
      try {
        const res = await apiFetch('/properties/public/listings?limit=3');
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
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#dceadf] shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <BrandLogoLink />

            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dceadf] bg-white text-gray-700 shadow-sm hover:bg-[#f4faf4] hover:border-[#c5ddc9] transition"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="home-mobile-nav"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium">
              <Link to="/" className="text-[#2f8444] border-b-2 border-[#2f8444] pb-1">
                Home
              </Link>
              {showFindProperty && (
                <Link to="/listings" className="text-gray-700 hover:text-[#2f8444] transition">
                  Find Property
                </Link>
              )}
              {showListProperty && (
                <Link to="/owner-dashboard/create-listing" className="text-gray-700 hover:text-[#2f8444] transition">
                  List Your Property
                </Link>
              )}
              {loggedIn ? (
                <Link to={dashboardPath} className="text-gray-700 hover:text-[#2f8444] transition">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-[#2f8444] transition">
                  Login
                </Link>
              )}
              {!loggedIn && (
                <Link
                  to="/signup"
                  className="bg-[#2f8444] hover:bg-[#256c38] text-white px-5 py-2 rounded-xl font-semibold transition"
                >
                  Sign Up
                </Link>
              )}
            </nav>
          </div>

        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px] motion-reduce:backdrop-blur-none animate-mobile-nav-backdrop motion-reduce:animate-none motion-reduce:opacity-100"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="home-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eef4ef]">
              <div className="flex min-w-0 items-center gap-2.5">
                <BrandLogoLink
                  imgClassName={BRAND_LOGO_IMG_CLASS_COMPACT}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <span id="home-mobile-nav-title" className="sr-only">
                  Main menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-1" aria-label="Mobile">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[#2f8444] bg-[#eef7ef]"
              >
                Home
              </Link>
              {showFindProperty && (
                <Link
                  to="/listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
                >
                  Find Property
                </Link>
              )}
              {showListProperty && (
                <Link
                  to="/owner-dashboard/create-listing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
                >
                  List Your Property
                </Link>
              )}
              {loggedIn ? (
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </aside>
        </div>
      )}

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

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14 lg:pb-16">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-[#2f8444] via-[#2a7a3f] to-[#1f5f31] text-white shadow-[0_20px_50px_rgba(31,95,49,0.28)] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#9bd5a8]/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <svg className="absolute left-4 top-5 h-12 w-12 text-emerald-100/70" viewBox="0 0 64 64" fill="none" aria-hidden>
              <path d="M10 30L32 14L54 30V53H38V39H26V53H10V30Z" fill="currentColor" />
              <path d="M6 31L32 10L58 31" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute right-24 top-6 h-10 w-10 text-emerald-100/60" viewBox="0 0 64 64" fill="none" aria-hidden>
              <path d="M12 31L32 17L52 31V52H39V41H25V52H12V31Z" fill="currentColor" />
              <path d="M8 32L32 13L56 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute left-20 bottom-6 h-11 w-11 text-emerald-100/55" viewBox="0 0 64 64" fill="none" aria-hidden>
              <path d="M11 32L32 16L53 32V53H40V43H24V53H11V32Z" fill="currentColor" />
              <path d="M8 33L32 13L56 33" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="pointer-events-none absolute right-3 bottom-3 sm:right-5 sm:bottom-5 lg:right-7 lg:bottom-6 opacity-30 sm:opacity-35">
            <svg className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 text-white" viewBox="0 0 120 120" fill="none" aria-hidden>
              <path d="M18 58L60 26L102 58V98C102 101.314 99.3137 104 96 104H74V74H46V104H24C20.6863 104 18 101.314 18 98V58Z" fill="currentColor" fillOpacity="0.9" />
              <path d="M10 60L60 18L110 60" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="86" cy="52" r="8" fill="#C7EBD0" fillOpacity="0.9" />
            </svg>
          </div>

          <div className={`relative z-10 flex flex-col gap-5 sm:gap-6 ${loggedIn ? 'items-center text-center' : 'lg:flex-row lg:items-center lg:justify-between'}`}>
            <div className={`${loggedIn ? 'max-w-2xl' : 'max-w-2xl'}`}>
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2">
                <svg className="h-5 w-5 text-emerald-100" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 11L12 4L20 11V20H14V14H10V20H4V11Z" fill="currentColor" />
                  <path d="M2.5 11.5L12 3L21.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-emerald-50">Verified homes, trusted people</span>
              </div>
              <h3 className="mt-3 text-xl sm:text-2xl lg:text-[1.8rem] font-bold leading-tight">
                Rent smarter with trusted listings and verified users across Rent Nao.
              </h3>
              <p className="mt-2 text-sm sm:text-base text-emerald-100/90 max-w-xl">
                Whether you are finding a home or listing one, manage everything in one place from discovery to request and agreement.
              </p>
            </div>

            {!loggedIn && (
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="inline-flex items-center justify-center rounded-xl bg-white text-[#1f5f31] font-semibold px-5 py-3 text-sm sm:text-base shadow-lg shadow-[#153f23]/25 hover:bg-[#f3fff5] transition w-full sm:w-auto"
              >
                Get Started Free
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

