import { useEffect, useState } from 'react';
import { AUTH_UPDATE_EVENT, getCurrentUser, getUserRole, isLoggedIn } from '../../lib/api';

export function useHomeAuth() {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const sync = () => setUser(getCurrentUser());
    window.addEventListener(AUTH_UPDATE_EVENT, sync);
    return () => window.removeEventListener(AUTH_UPDATE_EVENT, sync);
  }, []);

  return {
    user,
    loggedIn: isLoggedIn(),
    role: getUserRole(user),
  };
}

/** Primary + secondary homepage CTAs for guest, owner, and tenant. */
export function getHomeHeroCtas(role, loggedIn, t) {
  if (loggedIn && role === 'TENANT') {
    return {
      primary: { to: '/listings', label: t('home.heroCtaTenant') },
      secondary: { to: '/tenant-dashboard', label: t('nav.dashboard') },
    };
  }

  if (loggedIn && role === 'OWNER') {
    return {
      primary: { to: '/owner-dashboard/create-listing', label: t('home.heroCtaOwner') },
      secondary: { to: '/listings', label: t('home.browseProperties') },
    };
  }

  return {
    primary: { to: '/owner-registration', label: t('home.listPropertyFree') },
    secondary: { to: '/listings', label: t('home.browseProperties') },
  };
}
