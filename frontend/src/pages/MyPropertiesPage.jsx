import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiFetch, getApiErrorMessage, getRequestErrorMessage, isLoggedIn, isOwnerProfileMissingError } from '../lib/api';
import toast from 'react-hot-toast';

function areaLabel(areaName) {
  if (!areaName) return 'Area not set';
  return String(areaName).replaceAll('_', ' ');
}

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [listingBusyKey, setListingBusyKey] = useState(null);

  const getImageSrc = (image) =>
    image?.url ||
    image?.storagePath ||
    image?.storage_path ||
    image?.filePath ||
    image?.file_path ||
    '';

  const loadProperties = useCallback(async () => {
    const res = await apiFetch('/properties/me');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load properties'));
    const items = body?.data?.items || [];

    const withListings = await Promise.all(
      items.map(async (property) => {
        try {
          const listingRes = await apiFetch(`/properties/${property.propertyId}/listings`);
          const listingBody = await listingRes.json().catch(() => ({}));
          const listings = listingRes.ok ? (listingBody?.data?.items || []) : [];
          const imageRes = await apiFetch(`/properties/${property.propertyId}/images`);
          const imageBody = await imageRes.json().catch(() => ({}));
          const images = imageRes.ok ? (imageBody?.data?.items || []) : [];
          const primaryImage = images.find((img) => img?.isPrimary) || images[0] || null;
          return { ...property, listings, images, primaryImage };
        } catch {
          return { ...property, listings: [], images: [], primaryImage: null };
        }
      })
    );
    setProperties(withListings);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        if (!isLoggedIn()) {
          window.location.href = '/login';
          return;
        }
        await loadProperties();
      } catch (err) {
        setError(getRequestErrorMessage(err, 'Failed to load properties'));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadProperties]);

  const handleListingStatus = async (propertyId, listingId, listingStatus) => {
    const busy = `${propertyId}:${listingId}:${listingStatus}`;
    setListingBusyKey(busy);
    try {
      const res = await apiFetch(`/properties/${propertyId}/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingStatus }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, 'Update failed'));
      toast.success(listingStatus === 'UNLISTED' ? 'Listing paused (inactive)' : 'Listing is active again');
      await loadProperties();
    } catch (e) {
      toast.error(e?.message || 'Could not update listing');
    } finally {
      setListingBusyKey(null);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!propertyId) return;
    const ok = window.confirm(
      'Permanently delete this property from the database? All listings, images, and related data will be removed. This cannot be undone.'
    );
    if (!ok) return;
    setDeletingId(propertyId);
    try {
      const res = await apiFetch(`/properties/${propertyId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, 'Delete failed'));
      toast.success('Property permanently deleted');
      await loadProperties();
    } catch (e) {
      toast.error(e?.message || 'Could not delete property');
    } finally {
      setDeletingId(null);
    }
  };

  const anyBusy = Boolean(listingBusyKey) || Boolean(deletingId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Link
              to="/owner-dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-2"
            >
              <span aria-hidden>&larr;</span> Owner dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            <p className="text-sm text-gray-500 mt-1">
              Pause sets a listing to inactive (hidden from search). Delete removes the whole property permanently from the database.
            </p>
          </div>
          <Link
            to="/owner-dashboard/create-listing"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition whitespace-nowrap"
          >
            <span aria-hidden>+</span> List New Property
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm"
          >
            <p className="font-medium">{error}</p>
            {isOwnerProfileMissingError(error) ? (
              <p className="mt-2">
                <Link to="/owner-registration" className="font-semibold underline hover:text-red-900">
                  Complete owner registration
                </Link>{' '}
                to load and manage your properties.
              </p>
            ) : null}
          </div>
        )}

        {properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 mb-4">You have not listed any properties yet.</p>
            <Link
              to="/owner-dashboard/create-listing"
              className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => {
              const src = getImageSrc(property.primaryImage);
              const imgCount = property.images?.length || 0;
              return (
                <article
                  key={property.propertyId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow isolate"
                >
                  {/* Top half is clickable to the main listing */}
                  <Link
                    to={property.listings?.[0] ? `/listings/${property.listings[0].listingId}` : `/owner-dashboard/my-properties/${property.propertyId}/edit`}
                    className="block hover:opacity-95 transition-opacity"
                  >
                  <div className="relative h-44 bg-gray-100">
                    {src ? (
                      <img
                        src={src}
                        alt={property.primaryImage?.altText || property.title || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                        No photo yet
                      </div>
                    )}
                    {imgCount > 0 && (
                      <span className="absolute bottom-2 right-2 rounded-full border border-white/30 bg-black/60 text-white text-xs font-medium px-2.5 py-1 shadow-sm">
                        {imgCount} photo{imgCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2">
                      {property.title || 'Untitled property'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{areaLabel(property.areaName)}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {property.roomCount != null ? `${property.roomCount} beds` : '-'} -{' '}
                      {property.bathroomCount != null ? `${property.bathroomCount} baths` : '-'} -{' '}
                      {property.propertySizeSqft != null ? `${property.propertySizeSqft} sqft` : '-'}
                    </p>
                  </div>
                  </Link>

                  <div className="px-5 pb-5 flex-1 flex flex-col">
                    <div className="mt-4 space-y-2 flex-1">
                      {property.listings && property.listings.length > 0 ? (
                        property.listings.map((listing) => {
                          const busyPause =
                            listingBusyKey === `${property.propertyId}:${listing.listingId}:UNLISTED`;
                          const busyResume =
                            listingBusyKey === `${property.propertyId}:${listing.listingId}:ACTIVE`;
                          const canPause =
                            listing.listingStatus === 'ACTIVE' || listing.listingStatus === 'PENDING_PAYMENT';
                          const canResume = listing.listingStatus === 'UNLISTED';
                          const statusClass =
                            listing.listingStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : listing.listingStatus === 'UNLISTED'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-gray-200 text-gray-700';
                          return (
                            <Link
                              to={`/listings/${listing.listingId}`}
                              key={listing.listingId}
                              className="flex flex-col gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between hover:bg-gray-100 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-teal-700 truncate">
                                  BDT {Number(listing.rent || 0).toLocaleString()}/mo
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {listing.listingStartDate
                                    ? `Starts ${new Date(listing.listingStartDate).toLocaleDateString()}`
                                    : 'Available now'}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <span
                                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}
                                >
                                  {listing.listingStatus === 'UNLISTED' ? 'Paused' : listing.listingStatus}
                                </span>
                                {canPause ? (
                                  <button
                                    type="button"
                                    disabled={anyBusy}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleListingStatus(property.propertyId, listing.listingId, 'UNLISTED');
                                    }}
                                    className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-50"
                                  >
                                    {busyPause ? 'Pausing' : 'Pause'}
                                  </button>
                                ) : null}
                                {canResume ? (
                                  <button
                                    type="button"
                                    disabled={anyBusy}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleListingStatus(property.propertyId, listing.listingId, 'ACTIVE');
                                    }}
                                    className="shrink-0 rounded-md border border-teal-300 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                                  >
                                    {busyResume ? 'Resuming...' : 'Resume'}
                                  </button>
                                ) : null}
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-400">No listings for this property.</p>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2">
                      <Link
                        to={`/owner-dashboard/my-properties/${property.propertyId}/edit`}
                        className="w-full text-center bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition"
                      >
                        Edit details &amp; photos
                      </Link>
                      <button
                        type="button"
                        disabled={anyBusy}
                        onClick={() => handleDeleteProperty(property.propertyId)}
                        className="w-full text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 py-1"
                      >
                        {deletingId === property.propertyId ? 'Deleting' : 'Delete property (permanent)'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}


