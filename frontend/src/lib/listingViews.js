import { apiFetch } from './api';

export async function recordListingView(listingId) {
  if (!listingId) return null;

  try {
    const res = await apiFetch(`/properties/public/listings/${listingId}/view`, {
      method: 'POST',
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body?.data?.viewCount != null) {
      return Number(body.data.viewCount);
    }
  } catch {
    /* ignore tracking failures */
  }

  return null;
}
