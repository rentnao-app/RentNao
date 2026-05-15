import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandLogoLink, { BRAND_LOGO_IMG_CLASS_COMPACT } from '../components/BrandLogoLink';
import { apiFetch, getCurrentUser, getUserId, getUserRole, isLoggedIn } from '../lib/api';
import { getPublicProfileData, savePublicProfileSnapshot } from '../lib/publicProfiles';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const localUser = getCurrentUser();
  const localUserId = getUserId(localUser);
  const localRole = getUserRole(localUser);
  const canFetchRemote = isLoggedIn() && (localRole === 'ADMIN' || localUserId === userId);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      const localData = getPublicProfileData(userId);
      setProfileData(localData);

      if (!canFetchRemote) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`/users/${userId}/profile-status`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setRemoteLoaded(false);
          setError('Showing interaction-based profile summary (remote profile is restricted).');
          setLoading(false);
          return;
        }

        const profile = body?.data?.profile || {};
        savePublicProfileSnapshot({
          userId,
          name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || localData?.display?.name || 'User',
          email: body?.data?.contactEmail || '',
          phone: body?.data?.contactPhone || '',
          role: body?.data?.role || '',
          area: profile?.currentArea || '',
          profession: profile?.profession || '',
          verificationStatus: body?.data?.kycVerificationStatus || '',
        });
        setProfileData(getPublicProfileData(userId));
        setRemoteLoaded(true);
      } catch {
        setRemoteLoaded(false);
        setError('Showing interaction-based profile summary (network unavailable).');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [canFetchRemote, userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  if (!profileData?.snapshot && (profileData?.stats?.totalInteractions || 0) === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Available</h1>
          <p className="text-gray-500 mb-6">
            No public profile data found for this user yet.
          </p>
          <Link to="/listings" className="text-teal-700 font-semibold hover:text-teal-800">
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  const { display, stats, recentInteractions } = profileData;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <BrandLogoLink />

          <Link to="/listings" className="hidden lg:inline text-sm font-medium text-teal-700 hover:text-teal-800">
            Browse Listings
          </Link>

          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="public-profile-mobile-nav"
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
            id="public-profile-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-profile-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#eef4ef] px-5 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <BrandLogoLink
                  imgClassName={BRAND_LOGO_IMG_CLASS_COMPACT}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <span id="public-profile-mobile-nav-title" className="sr-only">
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
              <Link
                to="/listings"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                Browse Listings
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <section className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{display?.name || 'User'}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {display?.role || 'USER'}
            </span>
          </div>
          <p className="text-sm text-gray-700">
            Verification:{' '}
            <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-semibold">
              {display?.verificationStatus || 'N/A'}
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
            <p className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2">
              <span className="text-sky-700 font-medium">Email:</span> {display?.emailMasked || 'N/A'}
            </p>
            <p className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2">
              <span className="text-violet-700 font-medium">Phone:</span> {display?.phoneMasked || 'N/A'}
            </p>
            <p className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
              <span className="text-emerald-700 font-medium">Area:</span> {display?.area || 'N/A'}
            </p>
            <p className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <span className="text-amber-700 font-medium">Profession:</span> {display?.profession || 'N/A'}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Data source: {remoteLoaded ? 'Verified backend profile data' : 'Interaction-based public summary'}
          </p>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Interaction Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="text-emerald-700 text-xs font-medium">As Tenant</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalAsTenant || 0}</p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
              <p className="text-teal-700 text-xs font-medium">Accepted (Tenant)</p>
              <p className="text-xl font-bold text-gray-900">{stats?.acceptedAsTenant || 0}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <p className="text-indigo-700 text-xs font-medium">As Owner</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalAsOwner || 0}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-amber-700 text-xs font-medium">Accepted (Owner)</p>
              <p className="text-xl font-bold text-gray-900">{stats?.acceptedAsOwner || 0}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Interactions</h2>
          {recentInteractions?.length ? (
            <div className="space-y-2">
              {recentInteractions.map((item) => (
                <div key={item.requestId} className="border border-gray-100 rounded-lg px-4 py-3 bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-900">
                    Request #{item.requestId} - Listing #{item.listingId}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Status:{' '}
                    <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-emerald-700 font-semibold">
                      {item.status}
                    </span>{' '}
                    - {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No interactions recorded yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

