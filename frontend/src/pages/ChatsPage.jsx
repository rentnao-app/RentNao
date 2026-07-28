import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import {
  conversationStatusLabel,
  formatChatTime,
  isChatRole,
  listConversations,
} from '../lib/conversations';
import { useTranslation } from '../lib/i18n';

const FILTERS = ['', 'PENDING', 'ACCEPTED', 'CLOSED'];

function statusBadgeClass(status) {
  if (status === 'ACCEPTED') return 'bg-emerald-100 text-emerald-800';
  if (status === 'PENDING') return 'bg-amber-100 text-amber-900';
  if (status === 'CLOSED') return 'bg-gray-200 text-gray-700';
  return 'bg-gray-100 text-gray-700';
}

export default function ChatsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listConversations({
        status: filter || undefined,
        limit: 50,
      });
      setItems(result.conversations);
    } catch (err) {
      setError(err?.message || t('chats.loadFailed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isChatRole()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('chats.title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('chats.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t('common.refresh')}
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === value
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'
              }`}
            >
              {value ? conversationStatusLabel(value, t) : t('chats.filterAll')}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-700" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="text-gray-700 font-medium">{t('chats.emptyTitle')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('chats.emptyHint')}</p>
            <Link
              to="/listings"
              className="mt-6 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {t('chats.browseListings')}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const preview = item.lastMessage?.content || t('chats.noMessagesYet');
              const time = formatChatTime(item.lastMessage?.createdAt || item.createdAt);
              return (
                <li key={item.conversationId}>
                  <Link
                    to={`/chats/${item.conversationId}`}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                      {(item.otherParty?.displayName || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate font-semibold text-gray-900">
                          {item.otherParty?.displayName || t('chats.unknownUser')}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">{time}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-gray-600">
                        {item.property?.title || t('chats.unknownProperty')}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{preview}</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(item.status)}`}
                      >
                        {conversationStatusLabel(item.status, t)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
