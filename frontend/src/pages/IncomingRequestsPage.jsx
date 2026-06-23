import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { listOwnerIncomingRequests, reviewOwnerRequest } from '../lib/requests';
import { addLocalNotification } from '../lib/notifications';
import { savePublicProfileSnapshot } from '../lib/publicProfiles';
import { useTranslation } from '../lib/i18n';

export default function IncomingRequestsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [ownerListingIds, setOwnerListingIds] = useState([]);
  const ownerListingIdsRef = useRef([]);

  useEffect(() => {
    ownerListingIdsRef.current = ownerListingIds;
  }, [ownerListingIds]);

  const loadOwnerListingIds = useCallback(async () => {
    try {
      const propertyRes = await apiFetch('/properties/me');
      const propertyBody = await propertyRes.json().catch(() => ({}));
      if (!propertyRes.ok) return [];
      const properties = propertyBody?.data?.items || [];

      const listingSets = await Promise.all(
        properties.map(async (property) => {
          const res = await apiFetch(`/properties/${property.propertyId}/listings`);
          const body = await res.json().catch(() => ({}));
          if (!res.ok) return [];
          return (body?.data?.items || []).map((item) => String(item.listingId));
        })
      );
      return listingSets.flat();
    } catch {
      return [];
    }
  }, []);

  const load = useCallback(async (resolvedListingIds) => {
    setLoading(true);
    const listingIds = resolvedListingIds || ownerListingIdsRef.current;
    const state = await listOwnerIncomingRequests(listingIds);
    setItems(state.items || []);
    setRemoteAvailable(Boolean(state.remoteAvailable));
    (state.items || []).forEach((item) => {
      if (item?.tenant?.userId) {
        savePublicProfileSnapshot({
          userId: item.tenant.userId,
          name: item.tenant.name,
          email: item.tenant.email,
          phone: item.tenant.phone,
          role: 'TENANT',
        });
      }
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        const ids = await loadOwnerListingIds();
        setOwnerListingIds(ids);
        await load(ids);
      })();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadOwnerListingIds, load]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link
          to="/owner-dashboard"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-3"
        >
          <span aria-hidden>&larr;</span> {t('requests.incoming.backToDashboard')}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('requests.incoming.title')}</h1>
            <p className="text-sm text-gray-500">
              {remoteAvailable ? t('requests.incoming.syncRemote') : t('requests.incoming.syncLocal')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {t('common.refresh')}
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">{t('requests.incoming.loading')}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            {t('requests.incoming.empty')}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.requestId} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/listings/${item.listingId}`} className="font-semibold text-gray-900 hover:text-teal-700">
                      {t('common.listingNumber', { id: item.listingId })}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('requests.incoming.tenantLabel')}{' '}
                      {item.tenant?.userId ? (
                        <Link to={`/profile/${item.tenant.userId}`} className="text-teal-700 hover:text-teal-800 font-medium">
                          {item.tenant?.name || t('roles.tenant')}
                        </Link>
                      ) : (
                        <span>{item.tenant?.name || t('roles.tenant')}</span>
                      )}{' '}
                      {item.tenant?.email ? `(${item.tenant.email})` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('requests.applications.requestedOn', { date: new Date(item.requestedAt).toLocaleString() })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.requestStatus === 'ACCEPTED'
                      ? 'bg-green-100 text-green-700'
                      : item.requestStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : item.requestStatus === 'WITHDRAWN'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-amber-100 text-amber-700'
                  }`}>
                    {t(`common.status.request.${item.requestStatus}`, item.requestStatus)}
                  </span>
                </div>

                {item.requestStatus === 'PENDING' && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await reviewOwnerRequest(item.requestId, 'ACCEPT');
                        if (!result.ok) {
                          toast.error(t('requests.incoming.toast.acceptFailed'));
                          return;
                        }
                        addLocalNotification({
                          title: t('requests.incoming.notification.acceptedTitle'),
                          message: t('requests.incoming.notification.acceptedMessage', { id: item.listingId }),
                          url: '/owner-dashboard/requests',
                          type: 'REQUEST',
                        });
                        toast.success(t('requests.incoming.toast.accepted'));
                        await load();
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
                    >
                      {t('requests.incoming.accept')}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await reviewOwnerRequest(item.requestId, 'REJECT');
                        if (!result.ok) {
                          toast.error(t('requests.incoming.toast.rejectFailed'));
                          return;
                        }
                        addLocalNotification({
                          title: t('requests.incoming.notification.rejectedTitle'),
                          message: t('requests.incoming.notification.rejectedMessage', { id: item.listingId }),
                          url: '/owner-dashboard/requests',
                          type: 'REQUEST',
                        });
                        toast.success(t('requests.incoming.toast.rejected'));
                        await load();
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg"
                    >
                      {t('requests.incoming.reject')}
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
