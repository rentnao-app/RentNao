import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import toast from 'react-hot-toast';
import { listTenantRequests, withdrawTenantRequest } from '../lib/requests';
import { addLocalNotification } from '../lib/notifications';

export default function MyApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [remoteAvailable, setRemoteAvailable] = useState(false);

  const load = async () => {
    setLoading(true);
    const state = await listTenantRequests();
    setItems(state.items || []);
    setRemoteAvailable(Boolean(state.remoteAvailable));
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <BrandLogoLink />
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link to="/listings" className="text-xs sm:text-sm font-medium text-teal-700 hover:text-teal-800">
              Browse Listings
            </Link>
            <button type="button" onClick={load} className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800">
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-sm text-gray-500 mb-5 sm:mb-6">
          {remoteAvailable ? 'Applications synced with backend.' : 'Using local interaction fallback for requests.'}
        </p>

        {loading ? (
          <div className="text-sm text-gray-500">Loading applications...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-gray-500 mb-4">No applications yet.</p>
            <Link to="/listings" className="inline-block bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
              Find a Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div key={item.requestId} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <Link to={`/listings/${item.listingId}`} className="font-semibold text-gray-900 hover:text-teal-700">
                      Listing #{item.listingId}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.listing?.areaName || 'Unknown area'} - {item.listing?.rent ? `$${item.listing.rent}/mo` : 'Rent N/A'}
                    </p>
                    {item.ownerUserId && (
                      <p className="text-sm mt-1">
                        <Link to={`/profile/${item.ownerUserId}`} className="text-teal-700 hover:text-teal-800 font-medium">
                          View Owner Profile
                        </Link>
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Requested on {new Date(item.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${
                    item.requestStatus === 'ACCEPTED'
                      ? 'bg-green-100 text-green-700'
                      : item.requestStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : item.requestStatus === 'WITHDRAWN'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.requestStatus}
                  </span>
                </div>
                {item.requestStatus === 'PENDING' && (
                  <div className="mt-3 sm:mt-4">
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await withdrawTenantRequest(item.requestId);
                        if (!result.ok) {
                          toast.error('Failed to withdraw request');
                          return;
                        }
                        addLocalNotification({
                          title: 'Request Withdrawn',
                          message: 'You withdrew a pending tenant request.',
                          url: '/tenant-dashboard/applications',
                          type: 'REQUEST',
                        });
                        toast.success('Request withdrawn');
                        await load();
                      }}
                      className="w-full sm:w-auto text-left text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      Withdraw Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

