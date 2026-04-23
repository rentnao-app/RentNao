import { useState } from 'react';
import { apiFetch } from '../lib/api';

const BKASH_NUMBER = import.meta.env.VITE_BKASH_NUMBER || '01XXX-XXXXXX';
const LISTING_ACCESS_FEE = import.meta.env.VITE_LISTING_ACCESS_FEE || 50;

export default function BkashPaymentModal({ listingId, amount = LISTING_ACCESS_FEE, onSuccess, onClose }) {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = transactionId.trim();
    if (!tid) {
      setError('Please enter your bKash transaction ID.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/payments/listing-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          transaction_id: tid,
          amount: Number(amount),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Payment submission failed');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">Pay via bKash</h3>
        <p className="text-sm text-gray-500 mb-4">
          Send <strong>{amount} BDT</strong> to the following bKash number, then enter the transaction ID below.
        </p>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">bKash number</p>
          <p className="text-xl font-mono font-bold text-teal-800">{BKASH_NUMBER}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm mb-4"
            placeholder="e.g. TRX123456789"
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <p className="text-xs text-gray-400 mb-4">
            Admin will verify your payment. You will get access once confirmed.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

