/** Owner dashboard sidebar + mobile drawer navigation (single source of truth). */
export function getOwnerSidebarNavItems(t) {
  return [
    {
      to: '/owner-dashboard',
      label: t('nav.dashboard'),
      icon: 'M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z',
      exact: true,
    },
    {
      to: '/owner-dashboard/my-properties',
      label: t('nav.myProperties'),
      icon: 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4',
    },
    {
      to: '/owner-dashboard/requests',
      label: t('dashboard.owner.sidebar.tenantRequests'),
      icon: 'M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 0 6z',
    },
    {
      to: '/wallet',
      label: t('dashboard.owner.sidebar.walletPayments'),
      icon: 'M17 9V7a4 4 0 1 0-8 0v2M5 9h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
    },
    {
      to: '/account',
      label: t('dashboard.owner.sidebar.settings'),
      icon: 'M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94L14.4 2.7a.5.5 0 0 0-.49-.4h-3.82a.5.5 0 0 0-.49.4L9.25 5.32c-.57.23-1.11.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.52.4 1.06.71 1.63.94l.35 2.62a.5.5 0 0 0 .49.4h3.82a.5.5 0 0 0 .49-.4l.35-2.62c.57-.23 1.11-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 12 15.5z',
    },
    {
      to: '/faq',
      label: t('dashboard.owner.sidebar.support'),
      icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm.1 15.5a1.4 1.4 0 1 1 1.4-1.4 1.4 1.4 0 0 1-1.4 1.4zM14.2 11c-.9.7-1.4 1.1-1.4 2v.3h-1.6v-.4c0-1.4.8-2.1 1.7-2.8.7-.5 1.2-.9 1.2-1.5a1.7 1.7 0 0 0-3.3-.6l-1.6-.4a3.3 3.3 0 1 1 6.5 1c0 1.4-.8 2-1.5 2.4z',
    },
  ];
}
