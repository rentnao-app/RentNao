import { useCallback, useEffect, useState } from 'react';
import { apiFetch, AUTH_UPDATE_EVENT, getUserId } from '../lib/api';

/**
 * Fetches a presigned profile photo URL for the given user object (same endpoint as Account Settings).
 * Refetches when user id / stored photo key changes or when auth session updates (e.g. after upload).
 */
export function useProfilePhotoDownloadUrl(user) {
  const [url, setUrl] = useState('');

  const userId = getUserId(user);
  const photoKey =
    user?.profile?.profilePhotoKey ??
    user?.profile?.profile_picture_path ??
    user?.profilePhotoKey ??
    '';

  const load = useCallback(async () => {
    if (!userId) {
      setUrl('');
      return;
    }
    try {
      const res = await apiFetch(`/users/${userId}/profile-photo/download-url`);
      const body = await res.json().catch(() => ({}));
      const raw = body?.data?.downloadUrl;
      if (res.ok && typeof raw === 'string') {
        const u = raw.trim();
        if (u.startsWith('http://') || u.startsWith('https://')) {
          setUrl(u);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setUrl('');
  }, [userId, photoKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onAuth = () => void load();
    window.addEventListener(AUTH_UPDATE_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_UPDATE_EVENT, onAuth);
  }, [load]);

  return url;
}
