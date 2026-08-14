import { useMemo } from 'react';
import AppHeader from '../components/AppHeader';
import { useTranslation } from '../lib/i18n';

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function TermsPage() {
  const { messages } = useTranslation();
  const terms = messages.terms;
  const sections = useMemo(() => terms.sections || [], [terms.sections]);

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-slate-800">
      <AppHeader variant="wide" centerNav />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{terms.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{terms.title}</h1>
          <p className="mt-3 text-sm text-slate-500">{terms.lastUpdated}</p>
          <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 sm:text-sm">
            {terms.jurisdiction}
          </span>
        </header>

        <nav
          aria-label={terms.tocTitle}
          className="mt-10 rounded-2xl bg-emerald-50/90 px-5 py-6 ring-1 ring-emerald-100 sm:px-7 sm:py-7"
        >
          <h2 className="text-sm font-bold text-[#1e4732]">{terms.tocTitle}</h2>
          <ol className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="w-full text-left text-sm text-emerald-900/90 transition hover:text-emerald-700"
                >
                  <span className="font-semibold text-emerald-800">{index + 1}.</span> {section.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 sm:text-[1.35rem]">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">
                {(section.paragraphs || []).map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
                {Array.isArray(section.bullets) && section.bullets.length > 0 ? (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.bullets.map((line, bIndex) => (
                      <li key={bIndex}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </article>

        <p className="mt-12 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500 sm:text-sm">
          {terms.footerNote}
        </p>
      </main>
    </div>
  );
}
