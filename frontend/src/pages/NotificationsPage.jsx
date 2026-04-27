import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notifications';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remoteAvailable, setRemoteAvailable] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await fetchNotifications({ limit: 100 });
    setItems(result.items || []);
    setRemoteAvailable(Boolean(result.remoteAvailable));
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const handleItemClick = (id) => {
    markNotificationRead(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={load}
              className="text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-sm text-gray-500 mb-6">
          {remoteAvailable ? 'Live updates from backend are active.' : 'Showing local notifications until backend notification API is available.'}
        </p>

        {loading ? (
          <div className="text-sm text-gray-500">Loading notifications...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={item.url || '/notifications'}
                onClick={() => handleItemClick(item.id)}
                className={`block bg-white rounded-xl border p-4 hover:shadow-sm transition ${item.isRead ? 'border-gray-100' : 'border-teal-200 bg-teal-50/40'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                  </div>
                  {!item.isRead && <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold">New</span>}
                </div>
                <p className="text-xs text-gray-400 mt-3">{new Date(item.createdAt).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

