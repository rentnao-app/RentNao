import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch, getCurrentUser, getUserId, getUserRole, isLoggedIn } from '../lib/api';
import { getPublicProfileData, savePublicProfileSnapshot } from '../lib/publicProfiles';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);

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
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <Link to="/listings" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            Browse Listings
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <section className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">{display?.name || 'User'}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              {display?.role || 'USER'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Verification: <span className="font-semibold">{display?.verificationStatus || 'N/A'}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
            <p><span className="text-gray-500">Email:</span> {display?.emailMasked || 'N/A'}</p>
            <p><span className="text-gray-500">Phone:</span> {display?.phoneMasked || 'N/A'}</p>
            <p><span className="text-gray-500">Area:</span> {display?.area || 'N/A'}</p>
            <p><span className="text-gray-500">Profession:</span> {display?.profession || 'N/A'}</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Data source: {remoteLoaded ? 'Verified backend profile data' : 'Interaction-based public summary'}
          </p>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Interaction Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs">As Tenant</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalAsTenant || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs">Accepted (Tenant)</p>
              <p className="text-xl font-bold text-gray-900">{stats?.acceptedAsTenant || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs">As Owner</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalAsOwner || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs">Accepted (Owner)</p>
              <p className="text-xl font-bold text-gray-900">{stats?.acceptedAsOwner || 0}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Interactions</h2>
          {recentInteractions?.length ? (
            <div className="space-y-2">
              {recentInteractions.map((item) => (
                <div key={item.requestId} className="border border-gray-100 rounded-lg px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Request #{item.requestId} • Listing #{item.listingId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {item.status} • {new Date(item.timestamp).toLocaleString()}
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
