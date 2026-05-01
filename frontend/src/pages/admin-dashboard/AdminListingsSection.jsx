import { Link } from 'react-router-dom';
import {
  LISTING_STATUS_FILTERS,
  formatBdt,
  formatDate,
  listingStatusTone,
  toLabel,
} from './adminDashboardUtils';
import { Icon } from './AdminUi';

export default function AdminListingsSection({
  listings,
  listingsPagination,
  listingsLoading,
  listingsPage,
  setListingsPage,
  listingStatusFilter,
  setListingStatusFilter,
  selectedListingDetails,
  selectingListingId,
  handleSelectListing,
}) {
  const totalPages = listingsPagination?.totalPages ?? 1;
  const canPrev = listingsPage > 1;
  const canNext = listingsPage < totalPages;

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Listings</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {listingsPagination?.total ?? listings.length}
          </span>
        </div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
        <select
          value={listingStatusFilter}
          onChange={(e) => {
            setListingStatusFilter(e.target.value);
            setListingsPage(1);
          }}
          className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        >
          {LISTING_STATUS_FILTERS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Page {listingsPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!canPrev || listingsLoading}
              onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-700 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!canNext || listingsLoading}
              onClick={() => setListingsPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {listingsLoading && listings.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
            </div>
          ) : null}
          {!listingsLoading && listings.length === 0 ? (
            <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">No listings found.</p>
          ) : null}
          {listings.map((item) => (
            <button
              key={item.listingId}
              type="button"
              onClick={() => handleSelectListing(item)}
              disabled={selectingListingId === item.listingId}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedListingDetails?.listingId === item.listingId
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
              } disabled:opacity-60`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-800">{formatBdt(item.rent)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {toLabel(item.areaName)} - {item.roomCount} bed - {formatDate(item.listingStartDate)}
                  </p>
                </div>
                {selectingListingId === item.listingId ? (
                  <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-b-2 border-emerald-600" />
                ) : (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${listingStatusTone(item.listingStatus)}`}>
                    {toLabel(item.listingStatus)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
        {selectedListingDetails ? (
          <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500">Listing detail</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedListingDetails.title}</h2>
                <p className="mt-1 font-semibold text-emerald-800">{formatBdt(selectedListingDetails.rent)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listingStatusTone(selectedListingDetails.listingStatus)}`}>
                  {toLabel(selectedListingDetails.listingStatus)}
                </span>
                {selectedListingDetails.listingStatus === 'ACTIVE' ? (
                  <Link
                    to={`/listings/${selectedListingDetails.listingId}`}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-800"
                  >
                    Public page
                  </Link>
                ) : null}
              </div>
            </div>

            <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selectedListingDetails.description}</p>

            <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Property ID</p>
                <p className="break-all text-sm font-semibold text-slate-900">{selectedListingDetails.propertyId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Listing ID</p>
                <p className="break-all text-sm font-semibold text-slate-900">{selectedListingDetails.listingId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Area</p>
                <p className="text-sm font-semibold text-slate-900">{toLabel(selectedListingDetails.areaName)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Size (sq ft)</p>
                <p className="text-sm font-semibold text-slate-900">{selectedListingDetails.propertySizeSqft}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Rooms / baths / balcony</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedListingDetails.roomCount} / {selectedListingDetails.bathroomCount} / {selectedListingDetails.balconyCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Intended tenant</p>
                <p className="text-sm font-semibold text-slate-900">{toLabel(selectedListingDetails.intendedTenantType)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Listing period</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(selectedListingDetails.listingStartDate)}
                  {selectedListingDetails.listingEndDate ? ` -> ${formatDate(selectedListingDetails.listingEndDate)}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(selectedListingDetails.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Building</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedListingDetails.buildingFloors} fl - {toLabel(selectedListingDetails.buildingFacing)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Lift / generator / guard</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedListingDetails.hasLift ? 'Yes' : 'No'} / {selectedListingDetails.hasGenerator ? 'Yes' : 'No'} /{' '}
                  {selectedListingDetails.hasSecurityGuard ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-emerald-900">Location & owner (admin)</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-600">Address</p>
                  <p className="text-sm font-medium text-slate-900">{selectedListingDetails.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Coordinates</p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedListingDetails.exactLat != null && selectedListingDetails.exactLng != null
                      ? `${selectedListingDetails.exactLat}, ${selectedListingDetails.exactLng}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Owner email</p>
                  <p className="text-sm font-medium text-slate-900">{selectedListingDetails.ownerContact?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Owner phone</p>
                  <p className="text-sm font-medium text-slate-900">{selectedListingDetails.ownerContact?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Images</h3>
              {(selectedListingDetails.images || []).length === 0 ? (
                <p className="text-sm text-slate-500">No images uploaded.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {(selectedListingDetails.images || []).map((img) =>
                    img.url ? (
                      <a
                        key={img.imageId}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl border border-slate-200 shadow-sm"
                      >
                        <img src={img.url} alt={img.fileName || ''} className="h-36 w-48 object-cover" />
                        {img.isPrimary ? (
                          <span className="block bg-slate-900/80 px-2 py-1 text-center text-[10px] font-semibold text-white">
                            Primary
                          </span>
                        ) : null}
                      </a>
                    ) : (
                      <div key={img.imageId} className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-xs text-slate-500">
                        {img.fileName || img.imageId} (URL unavailable)
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center px-4">
              <Icon
                className="mx-auto mb-3 h-10 w-10 text-slate-400"
                path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
              <p className="text-base font-medium text-slate-700">Select a listing to view full details</p>
              <p className="mt-2 text-sm text-slate-500">Includes address, coordinates, and owner contact for moderation.</p>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
