import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink from './BrandLogoLink';
import { isLoggedIn } from '../lib/api';

/**
 * Shared chrome for Contact / Privacy / Cookies (and similar) pages.
 */
export default function StaticPageShell({ backLabel, navLinks = [], children, maxWidthClass = 'max-w-4xl' }) {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbf8] via-[#fafcfb] to-[#f2f7f3] text-slate-800">
      <header className="border-b border-[#dfece4] bg-white/90 shadow-[0_2px_10px_rgba(15,23,42,0.04)] backdrop-blur-sm">
        <div className={`${maxWidthClass} mx-auto flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6`}>
          <BrandLogoLink />
          {loggedIn ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel}
            </button>
          ) : (
            <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm text-slate-600 transition hover:text-emerald-800"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className={`${maxWidthClass} mx-auto px-4 py-10 sm:px-6 sm:py-12 lg:py-14`}>{children}</main>
    </div>
  );
}

export function StaticPageHero({ eyebrow, title, subtitle, lastUpdated }) {
  return (
    <header className="mb-8 sm:mb-10">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2A7D4F]">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      {lastUpdated ? <p className="mt-2 text-sm text-slate-500">{lastUpdated}</p> : null}
      {subtitle ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{subtitle}</p> : null}
    </header>
  );
}

function AccordionChevron({ open }) {
  return (
    <svg
      className={`mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? 'rotate-180 text-emerald-700' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function LegalSectionList({ sections = [] }) {
  const [openId, setOpenId] = useState(null);
  const baseId = useId();

  return (
    <div className="space-y-3">
      {sections.map((section, index) => {
        const itemId = `${baseId}-${index}`;
        const panelId = `legal-panel-${itemId}`;
        const buttonId = `legal-button-${itemId}`;
        const open = openId === itemId;

        return (
          <div
            key={section.title || itemId}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-300 ${
              open ? 'border-emerald-200 shadow-md' : 'border-slate-200/80 hover:border-emerald-200'
            }`}
          >
            <button
              id={buttonId}
              type="button"
              onClick={() => setOpenId((prev) => (prev === itemId ? null : itemId))}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full items-start gap-3 px-5 py-4 text-left sm:px-6 sm:py-5"
            >
              <h2 className="min-w-0 flex-1 text-base font-bold text-[#1e4732] sm:text-lg">
                {section.title}
              </h2>
              <AccordionChevron open={open} />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`space-y-3 border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-600 transition-opacity duration-300 ease-out motion-reduce:transition-none sm:px-6 ${
                    open ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {Array.isArray(section.paragraphs)
                    ? section.paragraphs.map((p) => <p key={p.slice(0, 48)}>{p}</p>)
                    : null}
                  {Array.isArray(section.bullets) && section.bullets.length > 0 ? (
                    <ul className="list-disc space-y-1.5 pl-5">
                      {section.bullets.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LegalRelatedLinks({ links }) {
  if (!links?.length) return null;
  return (
    <nav
      className="mt-8 flex flex-wrap gap-2 border-t border-[#dfece4] pt-6"
      aria-label="Related legal pages"
    >
      {links.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="inline-flex items-center rounded-full border border-[#dfece4] bg-white px-3.5 py-1.5 text-sm font-medium text-[#1a4728] transition hover:border-[#2A7D4F]/40 hover:bg-[#f6fbf8]"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
