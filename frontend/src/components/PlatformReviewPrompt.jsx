import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import {
  AUTH_UPDATE_EVENT,
  apiFetch,
  getApiErrorMessage,
  getRequestErrorMessage,
  isLoggedIn,
} from '../lib/api';
import { useTranslation } from '../lib/i18n';

const PROMPT_INTERVAL_MS = 2 * 60 * 1000;
const MAX_PROMPT_SHOWS = 3;
const MIN_CONTENT = 10;
const MAX_CONTENT = 1000;

const SHOW_COUNT_KEY = 'rentnao_review_prompt_show_count';
const SUBMITTED_KEY = 'rentnao_review_prompt_submitted';
/** Legacy key from earlier one-dismiss behavior — no longer used for skipping. */
const LEGACY_DISMISSED_KEY = 'rentnao_review_prompt_dismissed';

const EXCLUDED_PATH_PREFIXES = ['/login', '/signup', '/admin-dashboard', '/auth', '/review', '/reviews'];

function isExcludedPath(pathname) {
  return EXCLUDED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function readShowCount() {
  try {
    const n = Number(localStorage.getItem(SHOW_COUNT_KEY) || '0');
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeShowCount(count) {
  try {
    localStorage.setItem(SHOW_COUNT_KEY, String(Math.max(0, count)));
  } catch {
    // ignore
  }
}

function hasSubmittedReviewPrompt() {
  try {
    return localStorage.getItem(SUBMITTED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Call after a successful testimonial submit so the prompt never returns. */
export function markPlatformReviewSubmitted() {
  try {
    localStorage.setItem(SUBMITTED_KEY, '1');
    localStorage.removeItem(LEGACY_DISMISSED_KEY);
  } catch {
    // ignore
  }
}

function canShowPrompt() {
  return !hasSubmittedReviewPrompt() && readShowCount() < MAX_PROMPT_SHOWS;
}

export default function PlatformReviewPrompt() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const timerRef = useRef(null);
  const openRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  openRef.current = open;

  const trimmed = content.trim();
  const canSubmitReview =
    loggedIn && trimmed.length >= MIN_CONTENT && trimmed.length <= MAX_CONTENT && rating >= 1 && rating <= 5;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tryOpenPromptRef = useRef(async () => {});

  tryOpenPromptRef.current = async () => {
    if (!canShowPrompt() || openRef.current) return;

    if (isExcludedPath(window.location.pathname)) {
      if (!canShowPrompt()) return;
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        void tryOpenPromptRef.current();
      }, PROMPT_INTERVAL_MS);
      return;
    }

    if (isLoggedIn()) {
      try {
        const res = await apiFetch('/testimonials/me');
        const body = await res.json().catch(() => ({}));
        if (res.ok && body?.data?.hasReview === true) {
          markPlatformReviewSubmitted();
          clearTimer();
          return;
        }
      } catch {
        // still show prompt if check fails
      }
    }

    if (!canShowPrompt() || openRef.current) return;

    writeShowCount(readShowCount() + 1);
    setOpen(true);
  };

  const scheduleNextPrompt = useCallback(() => {
    clearTimer();
    if (!canShowPrompt()) return;
    timerRef.current = window.setTimeout(() => {
      void tryOpenPromptRef.current();
    }, PROMPT_INTERVAL_MS);
  }, [clearTimer]);

  const dismiss = useCallback(() => {
    setOpen(false);
    scheduleNextPrompt();
  }, [scheduleNextPrompt]);

  useEffect(() => {
    const syncAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener(AUTH_UPDATE_EVENT, syncAuth);
    return () => window.removeEventListener(AUTH_UPDATE_EVENT, syncAuth);
  }, []);

  useEffect(() => {
    scheduleNextPrompt();
    return clearTimer;
  }, [scheduleNextPrompt, clearTimer]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, dismiss]);

  const handleBackdropClick = (event) => {
    if (dialogRef.current && !dialogRef.current.contains(event.target)) {
      dismiss();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!loggedIn) {
      setOpen(false);
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!canSubmitReview || submitting) return;

    setSubmitting(true);
    try {
      const res = await apiFetch('/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, rating }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.success === false) {
        throw new Error(getApiErrorMessage(body, t('reviews.toast.submitFailed')));
      }

      markPlatformReviewSubmitted();
      clearTimer();
      toast.success(t('reviews.toast.submitted'));
      setOpen(false);
    } catch (err) {
      toast.error(getRequestErrorMessage(err, t('reviews.toast.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-3 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-review-prompt-title"
        className="relative w-full max-w-md rounded-xl border border-[#e5ece8] bg-white p-4 shadow-lg sm:p-5"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-[#6b7f74] transition hover:bg-[#f3f7f5] hover:text-[#1a4728]"
          aria-label={t('reviews.promptModal.close')}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 id="platform-review-prompt-title" className="pr-7 text-base font-semibold text-[#1a4728] sm:text-lg">
          {t('reviews.promptModal.title')}
        </h2>
        <p className="mt-1 text-xs text-[#5a7268] sm:text-sm">{t('reviews.promptModal.description')}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className={loggedIn ? '' : 'pointer-events-none opacity-50'}>
            <StarRating value={rating} size="md" interactive={loggedIn} onChange={setRating} />
          </div>

          <textarea
            id="platform-review-content"
            rows={3}
            maxLength={MAX_CONTENT}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            readOnly={!loggedIn}
            placeholder={loggedIn ? t('reviews.form.placeholder') : t('reviews.promptModal.guestPlaceholder')}
            className={`w-full resize-none rounded-lg border border-[#dfece4] px-3 py-2 text-sm text-[#1a4728] placeholder:text-[#8fa898] focus:border-[#2A7D4F] focus:outline-none focus:ring-1 focus:ring-[#2A7D4F]/20 ${
              loggedIn ? 'bg-white' : 'cursor-not-allowed bg-[#fafcfb]'
            }`}
          />

          <button
            type="submit"
            disabled={loggedIn ? !canSubmitReview || submitting : false}
            className="h-9 w-full rounded-lg bg-[#2A7D4F] text-sm font-medium text-white transition hover:bg-[#246341] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggedIn
              ? submitting
                ? t('reviews.form.submitting')
                : t('reviews.promptModal.submit')
              : t('reviews.promptModal.signInToSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
}
