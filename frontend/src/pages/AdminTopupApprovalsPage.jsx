import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { apiFetch, getApiErrorMessage, isLoggedIn } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import toast from 'react-hot-toast';
import { toLabel } from './admin-dashboard/adminDashboardUtils';

function money(value, currency = 'BDT') {
  const num = Number(value || 0);
  return `${num.toFixed(2)} ${currency}`;
}

export default function AdminTopupApprovalsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [topupRequests, setTopupRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [actionLoading, setActionLoading] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  const loadTopupRequests = useCallback(async (page = 1, status = 'PENDING') => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ page, limit: 20 });
      if (status) query.append('status', status);

      const res = await apiFetch(`/admin/topup-requests?${query.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, t('admin.toasts.loadTopupFailed')));

      setTopupRequests(body?.data?.topupRequests || []);
      setPagination(body?.data?.pagination || { page, totalPages: 1, total: 0 });
    } catch (e) {
      toast.error(e.message || t('admin.toasts.loadTopupFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleApprove = useCallback(
    async (topupRequestId) => {
      try {
        setActionLoading((prev) => ({ ...prev, [topupRequestId]: true }));
        const res = await apiFetch(`/admin/topup-requests/${topupRequestId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(getApiErrorMessage(body, t('admin.toasts.approveTopupFailed')));
        }

        toast.success(t('admin.toasts.topupApproved'));
        await loadTopupRequests(currentPage, statusFilter);
      } catch (e) {
        toast.error(e.message || t('admin.toasts.approveTopupFailed'));
      } finally {
        setActionLoading((prev) => ({ ...prev, [topupRequestId]: false }));
      }
    },
    [loadTopupRequests, currentPage, statusFilter, t]
  );

  const handleReject = useCallback(
    async (topupRequestId) => {
      const reason = rejectReason[topupRequestId] || '';
      if (!reason.trim()) {
        toast.error(t('admin.toasts.rejectReasonRequired'));
        return;
      }

      try {
        setActionLoading((prev) => ({ ...prev, [topupRequestId]: true }));
        const res = await apiFetch(`/admin/topup-requests/${topupRequestId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectionReason: reason }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(getApiErrorMessage(body, t('admin.toasts.rejectTopupFailed')));
        }

        toast.success(t('admin.toasts.topupRejected'));
        setRejectReason((prev) => {
          const newReasons = { ...prev };
          delete newReasons[topupRequestId];
          return newReasons;
        });
        await loadTopupRequests(currentPage, statusFilter);
      } catch (e) {
        toast.error(e.message || t('admin.toasts.rejectTopupFailed'));
      } finally {
        setActionLoading((prev) => ({ ...prev, [topupRequestId]: false }));
      }
    },
    [loadTopupRequests, currentPage, statusFilter, rejectReason, t]
  );

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = '/login';
      return;
    }
    loadTopupRequests(currentPage, statusFilter);
  }, [currentPage, statusFilter, loadTopupRequests]);

  const statusFilters = [
    { value: 'PENDING', label: t('admin.topup.pending') },
    { value: 'APPROVED', label: t('admin.topup.approved') },
    { value: 'REJECTED', label: t('admin.topup.rejected') },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          <Link to="/admin-dashboard" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            {t('admin.topup.backToDashboard')}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('admin.topup.title')}</h1>
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.topup.requestsTitle')}</h2>
            <div className="flex gap-2">
              {statusFilters.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    statusFilter === value
                      ? 'bg-teal-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {topupRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('admin.topup.empty')}</p>
          ) : (
            <div className="space-y-4">
              {topupRequests.map((req) => (
                <div key={req.topupRequestId} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('admin.topup.amount')}</p>
                      <p className="text-2xl font-bold text-teal-700">{money(req.amount, 'BDT')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('admin.topup.status')}</p>
                      <p className={`font-semibold text-lg ${
                        req.status === 'APPROVED' ? 'text-green-700' :
                        req.status === 'REJECTED' ? 'text-red-700' :
                        'text-yellow-700'
                      }`}>
                        {toLabel(req.status, t)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">{t('admin.topup.bkashNumber')}</p>
                      <p className="font-mono">{req.bkashNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('admin.topup.transactionId')}</p>
                      <p className="font-mono text-xs break-all">{req.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('admin.topup.requestedOn')}</p>
                      <p>{new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>{t('admin.topup.rejectionReason')}</strong> {req.rejectionReason}
                      </p>
                    </div>
                  )}

                  {req.status === 'PENDING' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.topupRequestId)}
                          disabled={actionLoading[req.topupRequestId]}
                          className="flex-1 bg-green-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[req.topupRequestId] ? t('admin.topup.approving') : t('admin.topup.approve')}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason[req.topupRequestId] || ''}
                          onChange={(e) =>
                            setRejectReason((prev) => ({
                              ...prev,
                              [req.topupRequestId]: e.target.value,
                            }))
                          }
                          placeholder={t('admin.topup.rejectPlaceholder')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows="2"
                        />
                        <button
                          onClick={() => handleReject(req.topupRequestId)}
                          disabled={actionLoading[req.topupRequestId]}
                          className="w-full bg-red-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[req.topupRequestId] ? t('admin.topup.rejecting') : t('admin.topup.reject')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-6 items-center justify-center">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              {t('admin.topup.prev')}
            </button>
            <span className="text-sm text-gray-600">
              {t('admin.topup.pageOf', { page: pagination.page, total: pagination.totalPages || 1 })}
            </span>
            <button
              type="button"
              disabled={currentPage >= (pagination.totalPages || 1)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              {t('admin.topup.next')}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
