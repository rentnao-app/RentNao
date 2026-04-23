import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch, getCurrentUser, isLoggedIn } from '../lib/api';

/**
 * Heart control for listing cards / detail. Tenants only; prompts login otherwise.
 */
export default function WishlistHeartButton({
  listingId,
  saved: savedProp,
  onSavedChange,
  className = '',
  size = 'md',
}) {
  const [saved, setSaved] = useState(Boolean(savedProp));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (savedProp !== undefined) {
      setSaved(Boolean(savedProp));
    }
  }, [savedProp]);

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const syncSaved = useCallback(
    (next) => {
      setSaved(next);
      onSavedChange?.(listingId, next);
    },
    [listingId, onSavedChange]
  );

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!listingId) return;

    const user = getCurrentUser();
    if (!isLoggedIn() || (user?.role || user?.userRole) !== 'TENANT') {
      toast.error('Log in as a tenant to save listings.');
      return;
    }

    setBusy(true);
    try {
      if (saved) {
        const res = await apiFetch(`/wishlists/${listingId}`, { method: 'DELETE' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || body?.message || 'Remove failed');
        syncSaved(false);
        toast.success('Removed from wishlist');
      } else {
        const res = await apiFetch(`/wishlists/${listingId}`, { method: 'POST' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || body?.message || 'Save failed');
        syncSaved(true);
        toast.success('Saved to wishlist');
      }
    } catch (err) {
      toast.error(err?.message || 'Wishlist update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={[
        dim,
        'inline-flex shrink-0 items-center justify-center rounded-full border shadow-sm transition',
        'backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2',
        saved
          ? 'border-rose-200/90 bg-white/95 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-50/90'
          : 'border-slate-200/90 bg-white/90 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-rose-500',
        'dark:border-zinc-600 dark:hover:bg-zinc-800',
        busy ? 'cursor-wait opacity-60' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {busy ? (
        <span
          className={`${icon} inline-block animate-spin rounded-full border-2 border-emerald-600 border-t-transparent`}
          aria-hidden
        />
      ) : (
        <svg className={icon} viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={saved ? 0 : 1.75}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}

