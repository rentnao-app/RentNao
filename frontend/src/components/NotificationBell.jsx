import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from '../lib/notifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [remoteAvailable, setRemoteAvailable] = useState(false);

  const loadBellData = async () => {
    setLoading(true);
    const [listRes, countRes] = await Promise.all([
      fetchNotifications({ limit: 5 }),
      fetchUnreadCount(),
    ]);
    setItems(listRes.items || []);
    setUnreadCount(countRes.count || 0);
    setRemoteAvailable(Boolean(listRes.remoteAvailable || countRes.remoteAvailable));
    setLoading(false);
  };

  useEffect(() => {
    const bootstrapTimer = setTimeout(() => {
      void loadBellData();
    }, 0);
    const timer = setInterval(() => {
      void loadBellData();
    }, 30000);
    return () => {
      clearTimeout(bootstrapTimer);
      clearInterval(timer);
    };
  }, []);

  const onItemClick = (id) => {
    markNotificationRead(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition ${
          open
            ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
            : 'border-emerald-200 bg-white text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50'
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ${open ? 'ring-emerald-700' : 'ring-white'}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="z-[110] max-h-[min(24rem,70vh)] overflow-hidden flex flex-col rounded-xl shadow-lg border border-gray-100 bg-white
            fixed left-3 right-3 top-16 w-auto
            sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:inset-x-auto sm:w-80 sm:max-w-[min(20rem,calc(100vw-1.5rem))]"
          >
            <div className="p-3 border-b border-gray-100 flex justify-between items-center gap-2 shrink-0">
              <span className="font-semibold text-gray-900 text-sm">Notifications</span>
              <Link to="/notifications" className="text-teal-600 text-xs font-medium shrink-0" onClick={() => setOpen(false)}>
                View all
              </Link>
            </div>
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">No notifications yet.</div>
              ) : (
                items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.url || '/notifications'}
                    onClick={() => onItemClick(item.id)}
                    className={`block p-3 border-b border-gray-50 hover:bg-gray-50 ${item.isRead ? '' : 'bg-teal-50/50'}`}
                  >
                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </Link>
                ))
              )}
            </div>
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-500">
                {remoteAvailable ? 'Live notifications enabled' : 'Using local notifications fallback'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

