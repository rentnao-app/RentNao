import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiFetch, getApiErrorMessage, getCurrentUser, getUserRole, isLoggedIn } from '../lib/api';
import toast from 'react-hot-toast';

function getLocalUserRole(user) {
  return getUserRole(user);
}

function money(value, currency = 'BDT') {
  const num = Number(value || 0);
  return `${num.toFixed(2)} ${currency}`;
}

export default function WalletPage() {
  const localUser = getCurrentUser();
  const role = getLocalUserRole(localUser);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsPagination, setTransactionsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [charges, setCharges] = useState([]);
  const [chargesPagination, setChargesPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [topupRequests, setTopupRequests] = useState([]);
  const [topupPagination, setTopupPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [chargesPage, setChargesPage] = useState(1);
  const [topupPage, setTopupPage] = useState(1);
  const [topupFormLoading, setTopupFormLoading] = useState(false);
  const [topupFormData, setTopupFormData] = useState({ amount: '', bkashNumber: '', transactionId: '' });

  const dashboardPath =
    role === 'ADMIN' ? '/admin-dashboard' : role === 'OWNER' ? '/owner-dashboard' : '/tenant-dashboard';

  const loadWallet = useCallback(async () => {
    const res = await apiFetch('/wallet');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load wallet'));
    setWallet(body?.data || null);
  }, []);

  const loadTransactions = useCallback(async (page = 1) => {
    const res = await apiFetch(`/wallet/transactions?page=${page}&limit=10`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load transactions'));
    setTransactions(body?.data?.transactions || []);
    setTransactionsPagination(body?.data?.pagination || { page, totalPages: 1, total: 0 });
  }, []);

  const loadCharges = useCallback(async (page = 1) => {
    const res = await apiFetch(`/wallet/charges?page=${page}&limit=10`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load charges'));
    setCharges(body?.data?.charges || []);
    setChargesPagination(body?.data?.pagination || { page, totalPages: 1, total: 0 });
  }, []);

  const loadTopupRequests = useCallback(async (page = 1) => {
    const res = await apiFetch(`/wallet/topup?page=${page}&limit=10`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load topup requests'));
    setTopupRequests(body?.data?.topupRequests || []);
    setTopupPagination(body?.data?.pagination || { page, totalPages: 1, total: 0 });
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadWallet(),
        loadTransactions(transactionsPage),
        loadCharges(chargesPage),
        loadTopupRequests(topupPage),
      ]);
    } catch (e) {
      toast.error(e.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [chargesPage, loadCharges, loadTransactions, loadWallet, loadTopupRequests, transactionsPage, topupPage]);

  const handleSubmitTopupRequest = useCallback(
    async (e) => {
      e.preventDefault();
      if (!topupFormData.amount || !topupFormData.bkashNumber || !topupFormData.transactionId) {
        toast.error('Please fill in all fields');
        return;
      }

      try {
        setTopupFormLoading(true);
        const res = await apiFetch('/wallet/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(topupFormData.amount),
            bkashNumber: topupFormData.bkashNumber,
            transactionId: topupFormData.transactionId,
          }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(getApiErrorMessage(body, 'Failed to submit topup request'));
        }

        toast.success('Topup request submitted successfully');
        setTopupFormData({ amount: '', bkashNumber: '', transactionId: '' });
        await loadTopupRequests(1);
        setTopupPage(1);
      } catch (e) {
        toast.error(e.message || 'Failed to submit topup request');
      } finally {
        setTopupFormLoading(false);
      }
    },
    [topupFormData, loadTopupRequests]
  );

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = '/login';
      return;
    }
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!loading) {
      loadTransactions(transactionsPage).catch((e) => toast.error(e.message || 'Failed to load transactions'));
    }
  }, [loading, loadTransactions, transactionsPage]);

  useEffect(() => {
    if (!loading) {
      loadCharges(chargesPage).catch((e) => toast.error(e.message || 'Failed to load charges'));
    }
  }, [chargesPage, loading, loadCharges]);

  useEffect(() => {
    if (!loading) {
      loadTopupRequests(topupPage).catch((e) => toast.error(e.message || 'Failed to load topup requests'));
    }
  }, [loading, loadTopupRequests, topupPage]);

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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <span aria-hidden>&larr;</span> Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Balance</h2>
          {wallet ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold text-teal-700">{money(wallet.availableBalance, wallet.currency)}</p>
              </div>
              <div>
                <p className="text-gray-500">Wallet Status</p>
                <p className="font-semibold">{wallet.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Wallet ID</p>
                <p className="font-mono text-xs break-all">{wallet.walletId}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Wallet data unavailable.</p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Request Topup</h2>
          <div className="mb-4 rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-3 text-sm text-gray-800">
            <p className="font-semibold text-gray-900 mb-2">Topup Steps:</p>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Go to <strong>bKash</strong>
              </li>
              <li>
                <strong>Send Money</strong> the topup amount in this number: <strong>01409033956</strong>
              </li>
              <li>
                Fill in the boxes with requested amount, your bKash number you used for Send Money, and the bKash
                Transaction ID
              </li>
            </ol>
          </div>
          <form onSubmit={handleSubmitTopupRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (BDT)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={topupFormData.amount}
                onChange={(e) => setTopupFormData({ ...topupFormData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 5000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">bKash Number</label>
              <input
                type="tel"
                maxLength="11"
                value={topupFormData.bkashNumber}
                onChange={(e) => setTopupFormData({ ...topupFormData, bkashNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 01712345678"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">bKash Transaction ID</label>
              <input
                type="text"
                value={topupFormData.transactionId}
                onChange={(e) => setTopupFormData({ ...topupFormData, transactionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., txn_abc123def456"
                required
              />
            </div>
            <button
              type="submit"
              disabled={topupFormLoading}
              className="w-full bg-teal-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {topupFormLoading ? 'Submitting...' : 'Submit Topup Request'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Topup Requests</h2>
            <p className="text-xs text-gray-500">
              Page {topupPagination.page} of {topupPagination.totalPages || 1}
            </p>
          </div>
          {topupRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No topup requests found.</p>
          ) : (
            <div className="space-y-2">
              {topupRequests.map((req) => (
                <div key={req.topupRequestId} className="border border-gray-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{money(req.amount, 'BDT')}</p>
                      <p className="text-gray-500 text-xs">From: {req.bkashNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        req.status === 'APPROVED' ? 'text-green-700' :
                        req.status === 'REJECTED' ? 'text-red-700' :
                        'text-yellow-700'
                      }`}>
                        {req.status}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">Reason: {req.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              disabled={topupPage <= 1}
              onClick={() => setTopupPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={topupPage >= (topupPagination.totalPages || 1)}
              onClick={() => setTopupPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
            <p className="text-xs text-gray-500">
              Page {transactionsPagination.page} of {transactionsPagination.totalPages || 1}
            </p>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions found.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div key={txn.transactionId} className="border border-gray-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{txn.type} ({txn.direction})</p>
                    <p className={txn.direction === 'CREDIT' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {txn.direction === 'CREDIT' ? '+' : '-'} {money(txn.amount, txn.currency)}
                    </p>
                  </div>
                  <p className="text-gray-500">{txn.description || 'No description'}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(txn.createdAt).toLocaleString()} | {txn.status}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              disabled={transactionsPage <= 1}
              onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={transactionsPage >= (transactionsPagination.totalPages || 1)}
              onClick={() => setTransactionsPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Charges</h2>
            <p className="text-xs text-gray-500">
              Page {chargesPagination.page} of {chargesPagination.totalPages || 1}
            </p>
          </div>
          {charges.length === 0 ? (
            <p className="text-sm text-gray-500">No charges found.</p>
          ) : (
            <div className="space-y-2">
              {charges.map((charge) => (
                <div key={charge.chargeId} className="border border-gray-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{charge.referenceType}</p>
                    <p className="font-semibold">{money(charge.finalAmount, charge.currency)}</p>
                  </div>
                  <p className="text-gray-500">Status: {charge.status}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(charge.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              disabled={chargesPage <= 1}
              onClick={() => setChargesPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={chargesPage >= (chargesPagination.totalPages || 1)}
              onClick={() => setChargesPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}


