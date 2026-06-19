import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import {
  apiFetch,
  getApiErrorMessage,
  getCurrentUser,
  getUserId,
  getUserRole,
} from '../../lib/api';
import { fetchNotifications } from '../../lib/notifications';

export default function ArefinDevTestPage() {
  const user = getCurrentUser();
  const userId = getUserId(user);
  const role = getUserRole(user);

  const [dealId, setDealId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [generateError, setGenerateError] = useState('');

  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [deedNotifications, setDeedNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');

  const handleGenerateRentDeed = async (e) => {
    e.preventDefault();
    const id = dealId.trim();
    if (!id) {
      setGenerateError('Enter a deal ID first.');
      return;
    }

    setGenerating(true);
    setGenerateError('');
    setGenerateResult(null);

    try {
      const res = await apiFetch(`/deals/${encodeURIComponent(id)}/rent-deed`, {
        method: 'POST',
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setGenerateError(getApiErrorMessage(body, `Request failed (${res.status})`));
        return;
      }

      setGenerateResult(body?.data || null);
    } catch (err) {
      setGenerateError(err?.message || 'Unexpected error');
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadDeedNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationError('');
    setDeedNotifications([]);

    try {
      const result = await fetchNotifications({ limit: 50 });
      const items = (result.items || []).filter(
        (item) =>
          item.type === 'RENT_DEED_GENERATED' ||
          item.data?.type === 'RENT_DEED_GENERATED' ||
          String(item.title || '').toLowerCase().includes('rent deed')
      );
      setDeedNotifications(items);
      if (items.length === 0) {
        setNotificationError('No rent deed notifications found yet. Generate a deed first.');
      }
    } catch (err) {
      setNotificationError(err?.message || 'Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-slate-800">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Temporary dev page — remove before production release</p>
          <p className="mt-1 text-amber-800">
            Tests Arefin&apos;s deals API: rent deed PDF generation, S3 upload, and in-app notifications.
          </p>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Arefin branch — deals test</h1>
        <p className="mt-1 text-sm text-slate-600">
          Logged in as <span className="font-medium">{userId || 'unknown'}</span> ({role || 'no role'})
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">1. Generate rent deed</h2>
          <p className="mt-1 text-sm text-slate-600">
            Calls <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">POST /deals/:dealId/rent-deed</code>.
            You must be the deal&apos;s owner or tenant.
          </p>

          <form onSubmit={handleGenerateRentDeed} className="mt-4 space-y-4">
            <div>
              <label htmlFor="dealId" className="block text-sm font-medium text-slate-700">
                Deal ID
              </label>
              <input
                id="dealId"
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                placeholder="e.g. clxyz123..."
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {generating ? 'Generating…' : 'Generate rent deed PDF'}
            </button>
          </form>

          {generateError ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              {generateError}
            </div>
          ) : null}

          {generateResult?.pdfUrl ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Success — deed generated and uploaded</p>
              <p className="mt-2 break-all text-xs text-emerald-800">{generateResult.pdfUrl}</p>
              <a
                href={generateResult.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Open PDF (15 min link)
              </a>
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">2. Check notifications</h2>
          <p className="mt-1 text-sm text-slate-600">
            After generating a deed, tenant and owner should get in-app notifications.
          </p>

          <button
            type="button"
            onClick={handleLoadDeedNotifications}
            disabled={loadingNotifications}
            className="mt-4 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
          >
            {loadingNotifications ? 'Loading…' : 'Load rent deed notifications'}
          </button>

          {notificationError ? (
            <p className="mt-3 text-sm text-slate-500">{notificationError}</p>
          ) : null}

          {deedNotifications.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {deedNotifications.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-slate-600">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          <Link
            to="/notifications"
            className="mt-4 inline-block text-sm font-semibold text-emerald-800 hover:text-emerald-900"
          >
            Open full notifications page →
          </Link>
        </section>

        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Setup: create a test Deal</h2>
          <p className="mt-1 text-sm text-slate-600">
            There is no create-deal API yet. Insert a row in Prisma Studio or psql using real IDs from your
            Property, Listing, Owner, and Tenant users.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`INSERT INTO "Deal" (deal_id, property_id, listing_id, owner_id, tenant_id)
VALUES (
  'test-deal-1',
  '<property_id>',
  '<listing_id>',
  '<owner_user_id>',
  '<tenant_user_id>'
);`}
          </pre>
          <p className="mt-2 text-xs text-slate-500">
            Owner and tenant profiles should have Bangla fields filled for the deed template.
          </p>
        </section>
      </main>
    </div>
  );
}
