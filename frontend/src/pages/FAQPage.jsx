import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useTranslation } from '../lib/i18n';

const CATEGORY_IDS = ['all', 'tenants', 'owners', 'wallet', 'kyc', 'agreements'];

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-700' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FaqAnswer({ item }) {
  return (
    <div className="space-y-2 border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-600 sm:px-6">
      {item.intro ? <p>{item.intro}</p> : null}
      {Array.isArray(item.bullets) && item.bullets.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5">
          {item.bullets.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      ) : null}
      {item.outro ? <p>{item.outro}</p> : null}
      {Array.isArray(item.extraBullets) && item.extraBullets.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5">
          {item.extraBullets.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      ) : null}
      {item.note ? <p className="text-slate-500">{item.note}</p> : null}
    </div>
  );
}

export default function FAQPage() {
  const { t, messages } = useTranslation();
  const faq = messages.faq;
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openId, setOpenId] = useState(null);

  const categoryLabels = useMemo(
    () => ({
      all: t('faq.categories.all'),
      tenants: t('faq.categories.tenants'),
      owners: t('faq.categories.owners'),
      wallet: t('faq.categories.wallet'),
      kyc: t('faq.categories.kyc'),
      agreements: t('faq.categories.agreements'),
    }),
    [t]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (faq.items || []).filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = [item.q, item.intro, ...(item.bullets || []), item.outro, item.note]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [faq.items, activeCategory, query]);

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-slate-800">
      <AppHeader variant="wide" centerNav />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <section className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{faq.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1e4732] sm:text-4xl">{faq.title}</h1>

          <form
            className="mx-auto mt-6 max-w-xl"
            onSubmit={(e) => e.preventDefault()}
            role="search"
          >
            <label htmlFor="faq-search" className="sr-only">
              {faq.searchPlaceholder}
            </label>
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                />
              </svg>
              <input
                id="faq-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={faq.searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:text-base"
              />
            </div>
          </form>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_IDS.map((id) => {
              const active = activeCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(id);
                    setOpenId(null);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100'
                  }`}
                >
                  {categoryLabels[id]}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-sm font-medium text-slate-500">
            {t('faq.resultsCount', { count: filteredItems.length })}
          </p>
        </section>

        <section className="mt-6 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
              {faq.empty}
            </div>
          ) : (
            filteredItems.map((item) => {
              const open = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-emerald-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left sm:px-6 sm:py-5"
                    aria-expanded={open}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        {categoryLabels[item.category]}
                      </p>
                      <h2 className="mt-1 text-base font-bold text-[#1e4732] sm:text-lg">{item.q}</h2>
                    </div>
                    <ChevronIcon open={open} />
                  </button>
                  {open ? <FaqAnswer item={item} /> : null}
                </div>
              );
            })
          )}
        </section>

        <section className="mt-10 rounded-2xl bg-emerald-50 px-6 py-10 text-center ring-1 ring-emerald-100 sm:px-10">
          <h2 className="text-xl font-bold text-[#1e4732] sm:text-2xl">{faq.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 sm:text-base">{faq.ctaBody}</p>
          <Link
            to="/about"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
          >
            {faq.ctaButton}
          </Link>
        </section>
      </main>
    </div>
  );
}
