import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppHeader from '../components/AppHeader';
import { ChatSocket } from '../lib/chatSocket';
import {
  acceptConversation,
  canUserSendMessage,
  closeConversation,
  conversationStatusLabel,
  formatChatTime,
  getConversation,
  getCurrentParticipantIds,
  getMessages,
  isChatRole,
  isConversationOwner,
  listConversations,
  sendConversationMessage,
} from '../lib/conversations';
import { useTranslation } from '../lib/i18n';

function mergeMessages(existing, incoming) {
  const map = new Map();
  [...existing, ...incoming].forEach((msg) => {
    if (msg?.messageId) map.set(msg.messageId, msg);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export default function ChatThreadPage() {
  const { conversationId } = useParams();
  const { t } = useTranslation();
  const { userId } = getCurrentParticipantIds();
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [closing, setClosing] = useState(false);

  const isOwner = isConversationOwner(conversation, userId);
  const canSend = canUserSendMessage({ conversation, userId, messages });
  const isClosed = conversation?.status === 'CLOSED';

  const otherName = useMemo(() => {
    if (conversation?.otherParty?.displayName) return conversation.otherParty.displayName;
    if (!conversation) return t('chats.unknownUser');
    return isOwner ? t('chats.tenant') : t('chats.owner');
  }, [conversation, isOwner, t]);

  const loadThread = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [conv, msgResult, listResult] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId, { limit: 50 }),
        listConversations({ limit: 50 }),
      ]);
      const enriched =
        listResult.conversations.find((c) => c.conversationId === conversationId) || conv;
      setConversation(enriched);
      setMessages(mergeMessages([], msgResult.messages));
      setHasMore(msgResult.hasMore);
      setNextCursor(msgResult.nextCursor);
    } catch (err) {
      setError(err?.message || t('chats.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [conversationId, t]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!conversationId || !isChatRole()) return undefined;

    const socket = new ChatSocket({
      onEvent: (payload) => {
        if (payload?.conversationId !== conversationId) return;

        if (payload.type === 'message' && payload.message) {
          setMessages((prev) => mergeMessages(prev, [payload.message]));
        }

        if (payload.type === 'conversation_status') {
          setConversation((prev) =>
            prev
              ? {
                  ...prev,
                  status: payload.status,
                  expiresAt: payload.expiresAt ?? prev.expiresAt,
                }
              : prev
          );
        }

        if (payload.type === 'joined' && payload.status) {
          setConversation((prev) => (prev ? { ...prev, status: payload.status } : prev));
        }

        if (payload.type === 'error') {
          toast.error(payload.reason || t('chats.sendFailed'));
        }
      },
    });

    socketRef.current = socket;
    void socket.connect();
    socket.join(conversationId);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, t]);

  const loadOlder = async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const result = await getMessages(conversationId, { cursor: nextCursor, limit: 50 });
      setMessages((prev) => mergeMessages(result.messages, prev));
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err) {
      toast.error(err?.message || t('chats.loadFailed'));
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend || sending) return;

    setSending(true);
    setDraft('');
    try {
      const sent = await sendConversationMessage(conversationId, text);
      if (sent) {
        setMessages((prev) => mergeMessages(prev, [sent]));
      }
    } catch (err) {
      setDraft(text);
      toast.error(err?.message || t('chats.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const updated = await acceptConversation(conversationId);
      setConversation((prev) => ({ ...prev, ...updated }));
      toast.success(t('chats.accepted'));
    } catch (err) {
      toast.error(err?.message || t('chats.acceptFailed'));
    } finally {
      setAccepting(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm(t('chats.closeConfirm'))) return;
    setClosing(true);
    try {
      const updated = await closeConversation(conversationId);
      setConversation((prev) => ({ ...prev, ...updated }));
      toast.success(t('chats.closed'));
    } catch (err) {
      toast.error(err?.message || t('chats.closeFailed'));
    } finally {
      setClosing(false);
    }
  };

  if (!isChatRole()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <Link
            to="/chats"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            ← {t('chats.backToList')}
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-700" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : (
          <>
            <header className="rounded-t-xl border border-b-0 border-gray-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-gray-900">{otherName}</h1>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {conversation?.property?.title || t('chats.unknownProperty')}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {conversationStatusLabel(conversation?.status, t)}
                    {conversation?.expiresAt && conversation.status === 'ACCEPTED'
                      ? ` · ${t('chats.expires')} ${formatChatTime(conversation.expiresAt)}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOwner && conversation?.status === 'PENDING' ? (
                    <button
                      type="button"
                      disabled={accepting}
                      onClick={() => void handleAccept()}
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                    >
                      {accepting ? t('chats.accepting') : t('chats.accept')}
                    </button>
                  ) : null}
                  {!isClosed ? (
                    <button
                      type="button"
                      disabled={closing}
                      onClick={() => void handleClose()}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {closing ? t('chats.closing') : t('chats.close')}
                    </button>
                  ) : null}
                </div>
              </div>

              {conversation?.status === 'PENDING' && !isOwner ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {canSend ? t('chats.tenantIntroHint') : t('chats.tenantWaitingHint')}
                </p>
              ) : null}

              {conversation?.status === 'PENDING' && isOwner ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {t('chats.ownerPendingHint')}
                </p>
              ) : null}
            </header>

            <div className="flex min-h-[20rem] flex-1 flex-col border border-gray-200 bg-white shadow-sm">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => void loadOlder()}
                    disabled={loadingOlder}
                    className="mx-auto block text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                  >
                    {loadingOlder ? t('common.loading') : t('chats.loadOlder')}
                  </button>
                ) : null}

                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">{t('chats.noMessagesYet')}</p>
                ) : (
                  messages.map((msg) => {
                    const mine = msg.senderId === userId;
                    return (
                      <div
                        key={msg.messageId}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                            mine
                              ? 'rounded-br-md bg-emerald-700 text-white'
                              : 'rounded-bl-md bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`mt-1 text-[10px] ${mine ? 'text-emerald-100' : 'text-gray-500'}`}
                          >
                            {formatChatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {!isClosed ? (
                <form
                  onSubmit={handleSend}
                  className="border-t border-gray-100 bg-gray-50/80 p-3"
                >
                  <div className="flex gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      disabled={!canSend || sending}
                      placeholder={
                        canSend ? t('chats.inputPlaceholder') : t('chats.inputDisabled')
                      }
                      className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100"
                    />
                    <button
                      type="submit"
                      disabled={!canSend || sending || !draft.trim()}
                      className="self-end rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
                    >
                      {sending ? t('chats.sending') : t('chats.send')}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">{t('chats.contentPolicy')}</p>
                </form>
              ) : (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
                  {t('chats.closedNotice')}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
