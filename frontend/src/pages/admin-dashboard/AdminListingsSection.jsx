import { Link } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
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
  const { t } = useTranslation();
  const totalPages = listingsPagination?.totalPages ?? 1;
  const canPrev = listingsPage > 1;
  const canNext = listingsPage < totalPages;

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">{t('admin.listings.title')}</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {listingsPagination?.total ?? listings.length}
          </span>
        </div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('admin.listings.status')}</label>
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
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>{t('admin.listings.pageOf', { page: listingsPage, total: totalPages })}</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!canPrev || listingsLoading}
              onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-700 disabled:opacity-40"
            >
              {t('admin.listings.prev')}
            </button>
            <button
              type="button"
              disabled={!canNext || listingsLoading}
              onClick={() => setListingsPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-700 disabled:opacity-40"
            >
              {t('admin.listings.next')}
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
            <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">{t('admin.listings.empty')}</p>
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
                  <p className="mt-1 text-xs font-medium text-emerald-800">{formatBdt(item.rent, t)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {toLabel(item.areaName, t)} - {item.roomCount} {t('admin.listings.bed')} - {formatDate(item.listingStartDate, t)}
                  </p>
                </div>
                {selectingListingId === item.listingId ? (
                  <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-b-2 border-emerald-600" />
                ) : (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${listingStatusTone(item.listingStatus)}`}>
                    {toLabel(item.listingStatus, t)}
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
                <p className="text-xs uppercase tracking-wide text-slate-500">{t('admin.listings.detail')}</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedListingDetails.title}</h2>
                <p className="mt-1 font-semibold text-emerald-800">{formatBdt(selectedListingDetails.rent, t)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listingStatusTone(selectedListingDetails.listingStatus)}`}>
                  {toLabel(selectedListingDetails.listingStatus, t)}
                </span>
                {selectedListingDetails.listingStatus === 'ACTIVE' ? (
                  <Link
                    to={`/listings/${selectedListingDetails.listingId}`}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-800"
                  >
                    {t('admin.listings.publicPage')}
                  </Link>
                ) : null}
              </div>
            </div>

            <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selectedListingDetails.description}</p>

            <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.propertyId')}</p>
                <p className="break-all text-sm font-semibold text-slate-900">{selectedListingDetails.propertyId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.listingId')}</p>
                <p className="break-all text-sm font-semibold text-slate-900">{selectedListingDetails.listingId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.area')}</p>
                <p className="text-sm font-semibold text-slate-900">{toLabel(selectedListingDetails.areaName, t)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.sizeSqft')}</p>
                <p className="text-sm font-semibold text-slate-900">{selectedListingDetails.propertySizeSqft}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.roomsBathsBalcony')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedListingDetails.roomCount} / {selectedListingDetails.bathroomCount} / {selectedListingDetails.balconyCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.intendedTenant')}</p>
                <p className="text-sm font-semibold text-slate-900">{toLabel(selectedListingDetails.intendedTenantType, t)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.listingPeriod')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(selectedListingDetails.listingStartDate, t)}
                  {selectedListingDetails.listingEndDate ? ` -> ${formatDate(selectedListingDetails.listingEndDate, t)}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.created')}</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(selectedListingDetails.createdAt, t)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.building')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedListingDetails.buildingFloors} {t('admin.listings.floors')} - {toLabel(selectedListingDetails.buildingFacing, t)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('admin.listings.liftGeneratorGuard')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedListingDetails.hasLift ? t('admin.listings.yes') : t('admin.listings.no')} /{' '}
                  {selectedListingDetails.hasGenerator ? t('admin.listings.yes') : t('admin.listings.no')} /{' '}
                  {selectedListingDetails.hasSecurityGuard ? t('admin.listings.yes') : t('admin.listings.no')}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-emerald-900">{t('admin.listings.locationOwner')}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-600">{t('admin.listings.address')}</p>
                  <p className="text-sm font-medium text-slate-900">{selectedListingDetails.address || t('admin.labels.na')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">{t('admin.listings.coordinates')}</p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedListingDetails.exactLat != null && selectedListingDetails.exactLng != null
                      ? `${selectedListingDetails.exactLat}, ${selectedListingDetails.exactLng}`
                      : t('admin.labels.na')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">{t('admin.listings.ownerEmail')}</p>
                  <p className="text-sm font-medium text-slate-900">{selectedListingDetails.ownerContact?.email || t('admin.labels.na')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">{t('admin.listings.ownerPhone')}</p>
                  <p className="text-sm font-medium text-slate-900">{selectedListingDetails.ownerContact?.phone || t('admin.labels.na')}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{t('admin.listings.images')}</h3>
              {(selectedListingDetails.images || []).length === 0 ? (
                <p className="text-sm text-slate-500">{t('admin.listings.noImages')}</p>
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
                            {t('admin.listings.primary')}
                          </span>
                        ) : null}
                      </a>
                    ) : (
                      <div key={img.imageId} className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-xs text-slate-500">
                        {t('admin.listings.urlUnavailable', { name: img.fileName || img.imageId })}
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
              <p className="text-base font-medium text-slate-700">{t('admin.listings.selectPrompt')}</p>
              <p className="mt-2 text-sm text-slate-500">{t('admin.listings.selectHint')}</p>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
