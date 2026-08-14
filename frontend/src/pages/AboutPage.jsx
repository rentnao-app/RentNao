import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { isLoggedIn } from '../lib/api';
import { useTranslation } from '../lib/i18n';

const highlightIcons = [
  (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
  ),
  (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
];

export default function AboutPage() {
  const { messages } = useTranslation();
  const about = messages.about;
  const loggedIn = isLoggedIn();

  const highlights = useMemo(
    () => [
      {
        title: about.whatWeDo.title,
        description: [about.whatWeDo.intro, ...about.whatWeDo.bullets].join(' '),
      },
      {
        title: about.smarter.title,
        description: [about.smarter.intro, about.smarter.outro].join(' '),
      },
      {
        title: about.fintech.title,
        description: [about.fintech.intro, about.fintech.outro].join(' '),
      },
      {
        title: about.why.bullets[0],
        description: about.whatWeDo.outro,
      },
    ],
    [about]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader variant="wide" centerNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-2">{about.hero.badge}</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{about.hero.title}</h1>
        <div className="text-base sm:text-lg text-gray-600 max-w-2xl mb-10 sm:mb-12 space-y-4 leading-relaxed">
          <p>{about.hero.subtitle}</p>
          {about.intro.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12 sm:mb-14">
          {highlights.map((item, index) => (
            <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-4">
                {highlightIcons[index]}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-12 sm:mb-14">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{about.vision.title}</h2>
            {about.vision.paragraphs.map((paragraph, index) => (
              <p key={index} className={`text-sm text-gray-600 leading-relaxed ${index > 0 ? 'mt-3' : ''}`}>
                {paragraph}
              </p>
            ))}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{about.mission.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{about.mission.text}</p>
            <h3 className="mt-5 text-base font-bold text-gray-900 mb-2">{about.why.title}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {about.why.bullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-teal-700 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="rounded-2xl bg-teal-800 text-white px-4 py-8 sm:px-8 sm:py-10 text-center">
          <h2 className="text-lg sm:text-xl font-bold mb-2">{about.cta.text}</h2>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-teal-800 font-semibold text-sm hover:bg-teal-50 transition w-full sm:w-auto"
            >
              {about.cta.browseListings}
            </Link>
            {!loggedIn && (
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-teal-400 text-white font-semibold text-sm hover:bg-teal-700/50 transition w-full sm:w-auto"
              >
                {about.cta.createAccount}
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
