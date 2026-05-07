import { useEffect, useState } from 'react';
import { apiFetch, isLoggedIn } from './api';

const TTL_MS = 60_000;

let cache = {
  balance: null,
  currency: 'BDT',
  fetchedAt: 0,
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  error: '',
};

const subscribers = new Set();
let inFlight = null;

function notify() {
  const snapshot = { ...cache };
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

function isFresh() {
  return cache.status === 'ready' && Date.now() - cache.fetchedAt < TTL_MS;
}

async function performFetch() {
  cache = { ...cache, status: 'loading', error: '' };
  notify();
  try {
    const res = await apiFetch('/wallet');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || body?.message || 'Failed to load wallet');
    }
    const data = body?.data || {};
    cache = {
      balance: data.availableBalance ?? data.balance ?? 0,
      currency: data.currency || 'BDT',
      fetchedAt: Date.now(),
      status: 'ready',
      error: '',
    };
  } catch (err) {
    cache = {
      ...cache,
      status: 'error',
      error: err?.message || 'Failed to load wallet',
    };
  } finally {
    inFlight = null;
    notify();
  }
}

/**
 * Returns the cached balance immediately and triggers a background fetch if stale.
 * Safe to call from anywhere; deduplicates concurrent requests.
 */
export function refreshWalletBalance({ force = false } = {}) {
  if (!isLoggedIn()) {
    cache = { balance: null, currency: 'BDT', fetchedAt: 0, status: 'idle', error: '' };
    notify();
    return Promise.resolve(cache);
  }
  if (!force && isFresh()) {
    return Promise.resolve(cache);
  }
  if (inFlight) return inFlight;
  inFlight = performFetch();
  return inFlight;
}

/**
 * Invalidate the cached balance so the next read re-fetches.
 * Call this after wallet-mutating operations (top-up, charge, etc.).
 */
export function invalidateWalletBalance() {
  cache = { ...cache, fetchedAt: 0 };
  notify();
}

export function getCachedWalletBalance() {
  return { ...cache };
}

/**
 * React hook returning `{ balance, currency, status, error, refresh }`.
 * - Subscribes to the shared cache so multiple components stay in sync.
 * - Triggers a fetch on mount if data is stale and the user is logged in.
 * - Refreshes on window focus.
 */
export function useWalletBalance() {
  const [snapshot, setSnapshot] = useState(() => getCachedWalletBalance());

  useEffect(() => {
    const onChange = (next) => setSnapshot(next);
    subscribers.add(onChange);
    if (isLoggedIn() && !isFresh() && cache.status !== 'loading') {
      void refreshWalletBalance();
    }
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (isLoggedIn() && !isFresh()) {
        void refreshWalletBalance();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return {
    balance: snapshot.balance,
    currency: snapshot.currency,
    status: snapshot.status,
    error: snapshot.error,
    refresh: () => refreshWalletBalance({ force: true }),
  };
}

export function formatWalletAmount(amount, currency = 'BDT') {
  if (amount == null || Number.isNaN(Number(amount))) return '--';
  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${Number(amount).toLocaleString()} ${currency}`;
  }
}
