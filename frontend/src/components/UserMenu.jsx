import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../lib/api';

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function dashboardPathFor(role) {
  if (role === 'OWNER') return '/owner-dashboard';
  if (role === 'TENANT') return '/tenant-dashboard';
  if (role === 'ADMIN') return '/admin-dashboard';
  return '/';
}

function roleLabel(role) {
  if (role === 'OWNER') return 'Owner';
  if (role === 'TENANT') return 'Tenant';
  if (role === 'ADMIN') return 'Admin';
  return 'Member';
}

/**
 * User avatar dropdown shown in the global header.
 * Props:
 *  - name: display name (string)
 *  - email: optional secondary line (string)
 *  - role: 'OWNER' | 'TENANT' | 'ADMIN'
 */
export default function UserMenu({ name = '', email = '', role = '' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const initials = initialsFromName(name || email);
  const dashboardHref = dashboardPathFor(role);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full bg-emerald-700 text-xs font-semibold text-white shadow-sm ring-2 ring-white/0 transition hover:ring-emerald-200 focus:outline-none focus:ring-emerald-300 sm:h-10 sm:w-10 sm:text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
        title={name || 'Account'}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[120] mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5"
        >
          <div className="border-b border-gray-100 bg-emerald-50/40 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">{name || 'Account'}</p>
            {email ? <p className="truncate text-xs text-gray-500">{email}</p> : null}
            <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              {roleLabel(role)}
            </p>
          </div>

          <ul className="py-1.5 text-sm" role="none">
            <li>
              <Link
                to={dashboardHref}
                onClick={close}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-800"
                role="menuitem"
              >
                <Icon path="M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/account"
                onClick={close}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-800"
                role="menuitem"
              >
                <Icon path="M5.121 17.804A13.937 13.937 0 0 1 12 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                Account Settings
              </Link>
            </li>
            <li>
              <Link
                to="/wallet"
                onClick={close}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-800"
                role="menuitem"
              >
                <Icon path="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                Wallet
              </Link>
            </li>
            <li>
              <Link
                to="/notifications"
                onClick={close}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-800"
                role="menuitem"
              >
                <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
                Notifications
              </Link>
            </li>
          </ul>

          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={() => {
                close();
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              role="menuitem"
            >
              <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Icon({ path, className = 'h-4 w-4 text-gray-500' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}
