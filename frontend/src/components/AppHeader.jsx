import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogoLink from './BrandLogoLink';
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
import { getOwnerSidebarNavItems } from '../lib/nav/ownerSidebarNav';
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

  const headerNavItems = useMemo(() => buildHeaderNav(role, loggedIn, t), [role, loggedIn, t]);
  const drawerNavItems = useMemo(() => buildDrawerNav(role, loggedIn, t), [role, loggedIn, t]);
  const userName = getUserDisplayName(user);
  const userEmail = user?.contactEmail || user?.contact_email || user?.email || '';
  const userInitials = getUserInitials(user);
  const profileAvatarUrl = useProfilePhotoDownloadUrl(loggedIn ? user : null);

  const containerClass =
    variant === 'wide'
      ? 'mx-auto max-w-[1500px] px-3 sm:px-6 lg:px-8'
      : 'mx-auto max-w-7xl px-3 sm:px-6 lg:px-8';

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(15,23,42,0.06)] overflow-x-clip">
        <div
          className={
            centerNav
              ? `${containerClass} flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3.5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-x-3`
              : `${containerClass} flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3.5`
          }
        >
          <div className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-3 ${centerNav ? 'lg:col-start-1 lg:flex-none' : ''}`}>
            <BrandLogoLink className="min-w-0 shrink-0" />
          </div>

          {/* Primary nav — hidden for roles that use a dashboard sidebar (e.g. owner) */}
          {headerNavItems.length > 0 ? (
            <nav
              className={`hidden items-center gap-1.5 xl:gap-2 lg:flex ${
                centerNav ? 'lg:justify-center lg:col-start-2 lg:row-start-1' : 'ml-auto shrink-0'
              }`}
              aria-label="Primary"
            >
              {headerNavItems.map((item) => (
                <NavLink key={item.to + item.label} item={item} pathname={location.pathname} />
              ))}
            </nav>
          ) : null}

          {/* Language toggle — desktop header; mobile uses drawer */}
          <div
            className={`ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4 shrink-0 ${
              centerNav ? 'lg:col-start-3 lg:row-start-1 lg:justify-self-end lg:ml-0' : ''
            }`}
          >
            <LanguageToggle className="hidden lg:inline-flex shrink-0" />

            {loggedIn ? (
              <>
                <WalletPill compact className="lg:hidden" />
                <WalletPill className="hidden lg:inline-flex" />
                <NotificationBell />
                <div className="hidden lg:block">
                  <UserMenu
                    name={userName}
                    email={userEmail}
                    role={role}
                    initials={userInitials}
                    avatarUrl={profileAvatarUrl}
                  />
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-2.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition sm:px-3"
                >
                  {t('header.login')}
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-emerald-700 px-2.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition sm:px-3.5"
                >
                  {t('header.signup')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger — primary nav on small screens */}
            <button
              type="button"
              className="lg:hidden inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition shrink-0"
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

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={drawerNavItems}
        pathname={location.pathname}
        loggedIn={loggedIn}
        userName={userName}
        userEmail={userEmail}
        userInitials={userInitials}
        profileAvatarUrl={profileAvatarUrl}
        role={role}
      />
    </>
  );
}

function NavLink({ item, pathname }) {
  const active = isActive(item, pathname);
  if (item.cta) {
    return (
      <Link
        to={item.to}
        className={`ml-1 inline-flex max-w-[9.5rem] xl:max-w-none items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-2 text-xs xl:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 xl:px-3.5 ${
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
        className={`inline-flex max-w-[9rem] xl:max-w-none items-center rounded-lg border px-2.5 py-2 text-xs xl:text-sm font-semibold shadow-sm transition xl:px-3.5 ${
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
      className={`rounded-lg px-2.5 py-2 text-sm font-medium transition xl:px-3 ${
        active
          ? 'bg-emerald-50 text-emerald-800'
          : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-800'
      }`}
    >
      {item.label}
    </Link>
  );
}

function WalletPill({ className = '', compact = false }) {
  const { balance, currency, status } = useWalletBalance();
  const { t } = useTranslation();
  const showSkeleton = status === 'loading' && balance == null;
  return (
    <Link
      to="/wallet"
      title={t('header.wallet')}
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 font-semibold text-emerald-800 transition hover:bg-emerald-100 shrink-0 ${
        compact
          ? 'max-w-[7.5rem] px-2 py-1.5 text-[11px] sm:max-w-[9rem] sm:px-2.5 sm:text-xs'
          : 'max-w-none px-3 py-2 text-sm'
      } ${className}`}
    >
      <Icon path="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" className={`shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
      {showSkeleton ? (
        <span className="inline-block h-3 w-12 animate-pulse rounded bg-emerald-200/70" aria-hidden />
      ) : balance == null ? (
        <span className="truncate max-sm:sr-only">{t('header.wallet')}</span>
      ) : (
        <span className="truncate tabular-nums">{formatWalletAmount(balance, currency)}</span>
      )}
    </Link>
  );
}

function MobileDrawer({
  open,
  onClose,
  navItems,
  pathname,
  loggedIn,
  userName,
  userEmail,
  userInitials,
  profileAvatarUrl,
  role,
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 380);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={t('header.closeMenu')}
        onClick={onClose}
      />
      <aside
        id="app-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-mobile-nav-title"
        className={`relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col border-l border-[#dceadf] bg-white pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] shadow-[-12px_0_40px_rgba(30,71,50,0.12)] transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none motion-reduce:transform-none ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#eef4ef] px-4 py-3.5">
          <span id="app-mobile-nav-title" className="text-sm font-semibold text-gray-900">
            {t('header.mainMenu')}
          </span>
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
          <div className="border-b border-[#eef4ef] px-4 py-4">
            <div className="flex items-center gap-3">
              <DrawerAvatar initials={userInitials} avatarUrl={profileAvatarUrl} name={userName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{userName || t('header.account')}</p>
                {userEmail && userEmail.toLowerCase() !== (userName || '').toLowerCase() ? (
                  <p className="truncate text-xs text-gray-500">{userEmail}</p>
                ) : null}
                <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                  {roleLabel(role, t)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="border-b border-[#eef4ef] px-4 py-3 lg:hidden">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t('language.label')}</p>
          <LanguageToggle />
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 flex flex-col gap-1" aria-label="Primary">
          {navItems.map((item) => (
            <DrawerNavLink key={item.to + item.label} item={item} pathname={pathname} onClose={onClose} />
          ))}
        </nav>

        {loggedIn ? (
          <div className="border-t border-[#eef4ef] p-4">
            {role !== 'OWNER' ? (
              <Link
                to="/account"
                onClick={onClose}
                className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                {t('header.accountSettings')}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className={`w-full rounded-xl bg-red-50 text-red-600 border border-red-100 py-2.5 text-sm font-semibold hover:bg-red-100 transition ${
                role !== 'OWNER' ? 'mt-2' : ''
              }`}
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

function DrawerNavLink({ item, pathname, onClose }) {
  const active = isActive(item, pathname);
  return (
    <Link
      to={item.to}
      onClick={onClose}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {item.icon ? (
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
            active ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Icon path={item.icon} className="h-4 w-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
    </Link>
  );
}

function DrawerAvatar({ initials, avatarUrl, name }) {
  const [imgErr, setImgErr] = useState(false);
  const showPhoto = avatarUrl && /^https?:\/\//i.test(String(avatarUrl).trim()) && !imgErr;

  useEffect(() => {
    setImgErr(false);
  }, [avatarUrl]);

  if (showPhoto) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-emerald-100"
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <div
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-700 text-sm font-semibold text-white ring-2 ring-emerald-100"
      aria-hidden={!name}
    >
      {initials || '?'}
    </div>
  );
}

function buildHeaderNav(role, loggedIn, t) {
  if (!loggedIn) {
    return [
      { to: '/', label: t('nav.home') },
      { to: '/listings', label: t('nav.browse') },
      { to: '/about', label: t('nav.about') },
      { to: '/faq', label: t('nav.faq') },
    ];
  }
  // Owner dashboard uses left sidebar — no duplicate links in header
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
      { to: '/chats', label: t('nav.chats') },
    ];
  }
  if (role === 'TENANT') {
    return [
      { to: '/tenant-dashboard', label: t('nav.dashboard'), buttonNav: true },
      { to: '/listings', label: t('nav.browse'), buttonNav: true },
      { to: '/tenant-dashboard/applications', label: t('nav.myApplications'), buttonNav: true },
      { to: '/tenant-dashboard/wishlist', label: t('nav.wishlist'), buttonNav: true },
      { to: '/chats', label: t('nav.chats'), buttonNav: true },
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

function buildDrawerNav(role, loggedIn, t) {
  if (!loggedIn) {
    return [
      { to: '/', label: t('nav.home'), icon: 'M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z' },
      { to: '/listings', label: t('nav.browse'), icon: 'M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z' },
      { to: '/about', label: t('nav.about'), icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
      { to: '/faq', label: t('nav.faq'), icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    ];
  }
  if (role === 'OWNER') {
    return getOwnerSidebarNavItems(t);
  }
  if (role === 'TENANT') {
    return [
      {
        to: '/tenant-dashboard',
        label: t('nav.dashboard'),
        buttonNav: true,
        icon: 'M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z',
      },
      {
        to: '/listings',
        label: t('nav.browse'),
        buttonNav: true,
        icon: 'M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
      },
      {
        to: '/tenant-dashboard/applications',
        label: t('nav.myApplications'),
        buttonNav: true,
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z',
      },
      {
        to: '/tenant-dashboard/wishlist',
        label: t('nav.wishlist'),
        buttonNav: true,
        icon: 'M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z',
      },
    ];
  }
  if (role === 'ADMIN') {
    return [
      {
        to: '/admin-dashboard',
        label: t('nav.dashboard'),
        icon: 'M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z',
      },
      {
        to: '/admin-dashboard/topup-approvals',
        label: t('nav.topupApprovals'),
        icon: 'M17 9V7a4 4 0 1 0-8 0v2M5 9h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
      },
      { to: '/listings', label: t('nav.listings'), icon: 'M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z' },
    ];
  }
  return [
    { to: '/', label: t('nav.home') },
    { to: '/listings', label: t('nav.browse') },
  ];
}

function isActive(item, pathname) {
  if (!item?.to) return false;
  if (item.exact) return pathname === item.to;
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
