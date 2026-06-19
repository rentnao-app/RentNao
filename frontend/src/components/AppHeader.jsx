import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogoLink, { BRAND_LOGO_IMG_CLASS_COMPACT } from './BrandLogoLink';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import {
  AUTH_UPDATE_EVENT,
  getCurrentUser,
  getUserDisplayName,
  getUserInitials,
  getUserRole,
  isLoggedIn,
  logout,
} from '../lib/api';
import { useProfilePhotoDownloadUrl } from '../hooks/useProfilePhotoDownloadUrl';
import { formatWalletAmount, useWalletBalance } from '../lib/walletBalance';
import { useTranslation } from '../lib/i18n';

/**
 * Shared global header.
 * Props:
 *  - variant: 'app' (default) | 'wide' for marketing pages with extra width.
 *  - centerNav: center primary nav links on large screens (homepage marketing layout).
 */
export default function AppHeader({ variant = 'app', centerNav = false }) {
  const location = useLocation();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location.pathname]);

  useEffect(() => {
    const onAuth = () => setUser(getCurrentUser());
    window.addEventListener(AUTH_UPDATE_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_UPDATE_EVENT, onAuth);
  }, []);

  const loggedIn = isLoggedIn();
  const role = getUserRole(user);

  useEffect(() => {
    const id = window.setTimeout(() => setDrawerOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const navItems = useMemo(() => buildNav(role, loggedIn, t), [role, loggedIn, t]);
  const userName = getUserDisplayName(user);
  const userEmail = user?.contactEmail || user?.contact_email || user?.email || '';
  const userInitials = getUserInitials(user);
  const profileAvatarUrl = useProfilePhotoDownloadUrl(loggedIn ? user : null);

  const containerClass =
    variant === 'wide'
      ? 'mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8'
      : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div
          className={
            centerNav
              ? `${containerClass} grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-3 py-3 sm:py-3.5`
              : `${containerClass} relative flex items-center gap-3 py-3 sm:gap-4 sm:py-3.5`
          }
        >
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogoLink className="min-w-0 shrink-0" />

            {/* Wallet pill sits next to the brand on the left (logged-in users) */}
            {loggedIn ? <WalletPill /> : null}
          </div>

          {/* Primary nav — centered on homepage, otherwise trailing */}
          <nav
            className={`hidden items-center gap-2 lg:flex ${
              centerNav ? 'justify-center col-start-2 row-start-1' : 'ml-auto'
            }`}
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <NavLink key={item.to + item.label} item={item} pathname={location.pathname} />
            ))}
          </nav>

          {/* Language toggle + auth / user actions */}
          <div
            className={`flex items-center gap-2 sm:gap-3 shrink-0 ${
              centerNav ? 'col-start-3 row-start-1 justify-self-end' : loggedIn ? '' : 'ml-auto md:ml-0'
            }`}
          >
            <LanguageToggle className="hidden md:inline-flex shrink-0" />

            {loggedIn ? (
              <>
                <NotificationBell />
                <UserMenu
                  name={userName}
                  email={userEmail}
                  role={role}
                  initials={userInitials}
                  avatarUrl={profileAvatarUrl}
                />
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  {t('header.login')}
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
                >
                  {t('header.signup')}
                </Link>
              </div>
            )}

            {/* Language — mobile header (compact, beside menu) */}
            <LanguageToggle compact className="md:hidden shrink-0" />

            {/* Mobile hamburger */}
            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              aria-label={t('header.openMenu')}
              aria-expanded={drawerOpen}
              aria-controls="app-mobile-nav"
              onClick={() => setDrawerOpen((o) => !o)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                {drawerOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <MobileDrawer
          onClose={() => setDrawerOpen(false)}
          navItems={navItems}
          pathname={location.pathname}
          loggedIn={loggedIn}
          userName={userName}
          userEmail={userEmail}
          role={role}
        />
      )}
    </>
  );
}

function NavLink({ item, pathname }) {
  const active = isActive(item, pathname);
  if (item.cta) {
    return (
      <Link
        to={item.to}
        className={`ml-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 ${
          active ? 'ring-2 ring-emerald-200' : ''
        }`}
      >
        {item.icon ? <Icon path={item.icon} className="h-4 w-4" /> : null}
        {item.label}
      </Link>
    );
  }
  if (item.buttonNav) {
    return (
      <Link
        to={item.to}
        className={`inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-semibold shadow-sm transition ${
          active
            ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
            : 'border-emerald-200 bg-white text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50'
        }`}
      >
        {item.label}
      </Link>
    );
  }
  return (
    <Link
      to={item.to}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-emerald-50 text-emerald-800'
          : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-800'
      }`}
    >
      {item.label}
    </Link>
  );
}

function WalletPill() {
  const { balance, currency, status } = useWalletBalance();
  const { t } = useTranslation();
  const showSkeleton = status === 'loading' && balance == null;
  return (
    <Link
      to="/wallet"
      title={t('header.wallet')}
      className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 sm:ml-4 sm:px-3 sm:py-2 sm:text-sm"
    >
      <Icon path="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" className="h-4 w-4" />
      {showSkeleton ? (
        <span className="inline-block h-3 w-12 animate-pulse rounded bg-emerald-200/70" aria-hidden />
      ) : balance == null ? (
        <span>{t('header.wallet')}</span>
      ) : (
        <span className="tabular-nums">{formatWalletAmount(balance, currency)}</span>
      )}
    </Link>
  );
}

function MobileDrawer({ onClose, navItems, pathname, loggedIn, userName, userEmail, role }) {
  const { t } = useTranslation();
  return (
    <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px]"
        aria-label={t('header.closeMenu')}
        onClick={onClose}
      />
      <aside
        id="app-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-mobile-nav-title"
        className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#eef4ef] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogoLink imgClassName={BRAND_LOGO_IMG_CLASS_COMPACT} onClick={onClose} />
            <span id="app-mobile-nav-title" className="sr-only">
              {t('header.mainMenu')}
            </span>
            {loggedIn ? <p className="truncate text-xs text-gray-500">{roleLabel(role, t)}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
            aria-label={t('header.closeMenu')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loggedIn ? (
          <div className="border-b border-[#eef4ef] px-5 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">{userName || t('header.account')}</p>
            {userEmail ? <p className="truncate text-xs text-gray-500">{userEmail}</p> : null}
            <Link
              to="/wallet"
              onClick={onClose}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
            >
              <Icon path="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" className="h-4 w-4" />
              <DrawerWalletAmount />
            </Link>
          </div>
        ) : null}

        <div className="border-b border-[#eef4ef] px-5 py-3 lg:hidden">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t('language.label')}</p>
          <LanguageToggle />
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 flex flex-col gap-1.5" aria-label="Primary">
          {navItems.map((item) => {
            const active = isActive(item, pathname);
            return (
            <Link
              key={item.to + item.label}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                item.cta
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800 font-semibold'
                  : item.buttonNav
                    ? active
                      ? 'border border-emerald-700 bg-emerald-700 font-semibold text-white'
                      : 'border border-emerald-200 bg-white font-semibold text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50'
                    : 'text-gray-700 hover:bg-emerald-50/80 font-medium'
              }`}
            >
              {item.label}
            </Link>
            );
          })}
        </nav>

        {loggedIn ? (
          <div className="border-t border-[#eef4ef] p-4">
            <Link
              to="/account"
              onClick={onClose}
              className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {t('header.accountSettings')}
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="mt-2 w-full rounded-xl bg-red-50 text-red-600 border border-red-100 py-2.5 text-sm font-semibold hover:bg-red-100 transition"
            >
              {t('header.logout')}
            </button>
          </div>
        ) : (
          <div className="border-t border-[#eef4ef] p-4 space-y-2">
            <Link
              to="/login"
              onClick={onClose}
              className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {t('header.login')}
            </Link>
            <Link
              to="/signup"
              onClick={onClose}
              className="block w-full rounded-xl bg-emerald-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800 transition"
            >
              {t('header.signup')}
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function DrawerWalletAmount() {
  const { balance, currency, status } = useWalletBalance();
  const { t } = useTranslation();
  if (status === 'loading' && balance == null) {
    return <span className="inline-block h-3 w-14 animate-pulse rounded bg-emerald-200/70" aria-hidden />;
  }
  if (balance == null) return <span>{t('header.wallet')}</span>;
  return <span className="tabular-nums">{formatWalletAmount(balance, currency)}</span>;
}

function buildNav(role, loggedIn, t) {
  if (!loggedIn) {
    return [
      { to: '/', label: t('nav.home') },
      { to: '/listings', label: t('nav.browse') },
      { to: '/about', label: t('nav.about') },
      { to: '/faq', label: t('nav.faq') },
    ];
  }
  if (role === 'OWNER') {
    return [
      { to: '/owner-dashboard', label: t('nav.dashboard') },
      { to: '/owner-dashboard/my-properties', label: t('nav.myProperties'), cta: true },
      {
        to: '/owner-dashboard/create-listing',
        label: t('nav.listYourProperty'),
        cta: true,
        icon: 'M12 4v16m8-8H4',
      },
      { to: '/owner-dashboard/requests', label: t('nav.requests') },
    ];
  }
  if (role === 'TENANT') {
    return [
      { to: '/tenant-dashboard', label: t('nav.dashboard'), buttonNav: true },
      { to: '/listings', label: t('nav.browse'), buttonNav: true },
      { to: '/tenant-dashboard/applications', label: t('nav.myApplications'), buttonNav: true },
      { to: '/tenant-dashboard/wishlist', label: t('nav.wishlist'), buttonNav: true },
    ];
  }
  if (role === 'ADMIN') {
    return [
      { to: '/admin-dashboard', label: t('nav.dashboard') },
      { to: '/admin-dashboard/topup-approvals', label: t('nav.topupApprovals') },
      { to: '/listings', label: t('nav.listings') },
    ];
  }
  return [
    { to: '/', label: t('nav.home') },
    { to: '/listings', label: t('nav.browse') },
  ];
}

function isActive(item, pathname) {
  if (!item?.to) return false;
  if (item.to === '/') return pathname === '/';
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function roleLabel(role, t) {
  if (role === 'OWNER') return t('roles.owner');
  if (role === 'TENANT') return t('roles.tenant');
  if (role === 'ADMIN') return t('roles.admin');
  return t('roles.member');
}

function Icon({ path, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}
