import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getApiErrorMessage, getCurrentUser, getUserRole, isLoggedIn } from '../lib/api';
import { addLocalNotification } from '../lib/notifications';
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
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [chargesPage, setChargesPage] = useState(1);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupStatus, setTopupStatus] = useState(null);
  const pollTimerRef = useRef(null);

  const dashboardPath =
    role === 'ADMIN' ? '/admin-dashboard' : role === 'OWNER' ? '/owner-dashboard' : '/tenant-dashboard';

  const pendingTopup = useMemo(
    () => topupStatus && topupStatus.status === 'PENDING' && topupStatus.topupId,
    [topupStatus]
  );

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

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadWallet(), loadTransactions(transactionsPage), loadCharges(chargesPage)]);
    } catch (e) {
      toast.error(e.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [chargesPage, loadCharges, loadTransactions, loadWallet, transactionsPage]);

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
    if (!pendingTopup) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/wallet/topup/${topupStatus.topupId}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const data = body?.data;
        if (!data) return;
        setTopupStatus(data);
        if (data.status !== 'PENDING') {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          await Promise.all([loadWallet(), loadTransactions(transactionsPage)]);
          if (data.status === 'SUCCESS') {
            toast.success('Topup completed successfully.');
            addLocalNotification({
              title: 'Topup Successful',
              message: `Wallet topup of ${money(data.requestedAmount, data.currency)} completed.`,
              url: '/wallet',
              type: 'WALLET',
            });
          }
          if (data.status === 'FAILED') {
            toast.error(data.failureReason || 'Topup failed.');
            addLocalNotification({
              title: 'Topup Failed',
              message: data.failureReason || 'Your wallet topup could not be completed.',
              url: '/wallet',
              type: 'WALLET',
            });
          }
        }
      } catch {
        // keep polling silently
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [loadTransactions, loadWallet, pendingTopup, topupStatus?.topupId, transactionsPage]);

  const submitTopup = async (e) => {
    e.preventDefault();
    const amountNum = Number(topupAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Enter a valid topup amount');
      return;
    }

    setTopupLoading(true);
    try {
      const res = await apiFetch('/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          provider: 'BKASH',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to create topup'));

      const topup = body?.data;
      if (!topup) throw new Error('Topup response missing data');
      setTopupStatus(topup);
      setTopupAmount('');

      if (topup.status === 'SUCCESS') {
        toast.success('Topup completed successfully.');
        addLocalNotification({
          title: 'Topup Successful',
          message: `Wallet topup of ${money(topup.requestedAmount, topup.currency)} completed.`,
          url: '/wallet',
          type: 'WALLET',
        });
        await Promise.all([loadWallet(), loadTransactions(transactionsPage)]);
      } else if (topup.status === 'FAILED') {
        toast.error(topup.failureReason || 'Topup failed.');
        addLocalNotification({
          title: 'Topup Failed',
          message: topup.failureReason || 'Your wallet topup could not be completed.',
          url: '/wallet',
          type: 'WALLET',
        });
      } else {
        toast.success('Topup requested. Checking status...');
        addLocalNotification({
          title: 'Topup Requested',
          message: `Wallet topup of ${money(topup.requestedAmount, topup.currency)} is processing.`,
          url: '/wallet',
          type: 'WALLET',
        });
      }
    } catch (e) {
      const message = e?.message || 'Topup failed';
      const isBkashConnectionIssue =
        message.includes('Unable to connect') ||
        message.toLowerCase().includes('bkash integration error');
      toast.error(
        isBkashConnectionIssue
          ? 'Topup service is currently unavailable. Please start the bKash service and try again.'
          : message
      );
    } finally {
      setTopupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <Link to={dashboardPath} className="text-sm font-medium text-teal-700 hover:text-teal-800">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Topup (bKash)</h2>
          <form onSubmit={submitTopup} className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="w-full md:w-64">
              <label className="block text-sm text-gray-600 mb-1">Amount (BDT)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="500"
              />
            </div>
            <button
              type="submit"
              disabled={topupLoading}
              className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50"
            >
              {topupLoading ? 'Processing...' : 'Topup'}
            </button>
          </form>

          {topupStatus && (
            <div className="mt-4 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p><span className="text-gray-500">Topup ID:</span> <span className="font-mono">{topupStatus.topupId}</span></p>
              <p><span className="text-gray-500">Status:</span> <span className="font-semibold">{topupStatus.status}</span></p>
              <p><span className="text-gray-500">Amount:</span> {money(topupStatus.requestedAmount, topupStatus.currency)}</p>
              {topupStatus.failureReason && <p className="text-red-600">{topupStatus.failureReason}</p>}
            </div>
          )}
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

