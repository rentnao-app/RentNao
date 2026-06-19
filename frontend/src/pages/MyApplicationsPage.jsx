import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import toast from 'react-hot-toast';
import { listTenantRequests, withdrawTenantRequest } from '../lib/requests';
import { addLocalNotification } from '../lib/notifications';
import { useTranslation } from '../lib/i18n';

export default function MyApplicationsPage() {
  const { t } = useTranslation();
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
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('requests.applications.title')}</h1>
          <button
            type="button"
            onClick={load}
            className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
          >
            {t('common.refresh')}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5 sm:mb-6">
          {remoteAvailable ? t('requests.applications.syncRemote') : t('requests.applications.syncLocal')}
        </p>

        {loading ? (
          <div className="text-sm text-gray-500">{t('requests.applications.loading')}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-gray-500 mb-4">{t('requests.applications.empty')}</p>
            <Link to="/listings" className="inline-block bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
              {t('requests.applications.findListing')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div key={item.requestId} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <Link to={`/listings/${item.listingId}`} className="font-semibold text-gray-900 hover:text-teal-700">
                      {t('common.listingNumber', { id: item.listingId })}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.listing?.areaName || t('common.unknownArea')} - {item.listing?.rent ? `$${item.listing.rent}${t('common.perMonth')}` : t('common.rentNa')}
                    </p>
                    {item.ownerUserId && (
                      <p className="text-sm mt-1">
                        <Link to={`/profile/${item.ownerUserId}`} className="text-teal-700 hover:text-teal-800 font-medium">
                          {t('requests.applications.viewOwnerProfile')}
                        </Link>
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {t('requests.applications.requestedOn', { date: new Date(item.requestedAt).toLocaleString() })}
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
                    {t(`common.status.request.${item.requestStatus}`, item.requestStatus)}
                  </span>
                </div>
                {item.requestStatus === 'PENDING' && (
                  <div className="mt-3 sm:mt-4">
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await withdrawTenantRequest(item.requestId);
                        if (!result.ok) {
                          toast.error(t('requests.applications.toast.withdrawFailed'));
                          return;
                        }
                        addLocalNotification({
                          title: t('requests.applications.notification.withdrawnTitle'),
                          message: t('requests.applications.notification.withdrawnMessage'),
                          url: '/tenant-dashboard/applications',
                          type: 'REQUEST',
                        });
                        toast.success(t('requests.applications.toast.withdrawn'));
                        await load();
                      }}
                      className="w-full sm:w-auto text-left text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      {t('requests.applications.withdraw')}
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
