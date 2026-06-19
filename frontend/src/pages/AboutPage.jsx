import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';

export default function AboutPage() {
  const { messages } = useTranslation();
  const about = messages.about;

  return (
    <div className="min-h-screen bg-[#f4f8f5]">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-[#2f8444] tracking-tight">
            Rent Nao
          </Link>
          <nav className="flex gap-4 sm:gap-6">
            <Link to="/listings" className="text-sm text-gray-600 hover:text-[#2f8444] transition">{about.nav.listings}</Link>
            <Link to="/services" className="text-sm text-gray-600 hover:text-[#2f8444] transition">{about.nav.services}</Link>
            <Link to="/signup" className="text-sm font-semibold text-[#2f8444] hover:text-[#256c38] transition">{about.nav.signup}</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-[#2f8444] via-[#2a7a3f] to-[#1f5f31] text-white px-5 py-7 sm:px-8 sm:py-10 shadow-[0_24px_50px_rgba(31,95,49,0.24)]">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {about.hero.badge}
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{about.hero.title}</h1>
              <p className="mt-3 text-sm sm:text-base text-emerald-50/90 max-w-2xl leading-relaxed">{about.hero.subtitle}</p>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <svg className="h-40 w-40 text-white/90" viewBox="0 0 120 120" fill="none" aria-hidden>
                <path d="M18 58L60 26L102 58V98C102 101.314 99.3137 104 96 104H74V74H46V104H24C20.6863 104 18 101.314 18 98V58Z" fill="currentColor" fillOpacity="0.95" />
                <path d="M10 60L60 18L110 60" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="86" cy="52" r="8" fill="#C7EBD0" fillOpacity="0.9" />
              </svg>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
          {about.intro.paragraphs.map((paragraph, index) => (
            <p key={index} className={`text-sm sm:text-base text-gray-700 leading-relaxed ${index > 0 ? 'mt-4' : ''}`}>
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2f8444]">{about.whatWeDo.title}</h2>
          <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">{about.whatWeDo.intro}</p>
          <ul className="mt-4 space-y-3 text-sm sm:text-base text-gray-700">
            {about.whatWeDo.bullets.map((line, index) => (
              <li key={index}>- {line}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">{about.whatWeDo.outro}</p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">{about.smarter.title}</h3>
            <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">{about.smarter.intro}</p>
            <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-700">
              {about.smarter.bullets.map((line, index) => (
                <li key={index}>- {line}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">{about.smarter.outro}</p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">{about.fintech.title}</h3>
            <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">{about.fintech.intro}</p>
            <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-700">
              {about.fintech.bullets.map((line, index) => (
                <li key={index}>- {line}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">{about.fintech.outro}</p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2f8444]">{about.vision.title}</h2>
          {about.vision.paragraphs.map((paragraph, index) => (
            <p key={index} className={`text-sm sm:text-base text-gray-700 leading-relaxed ${index > 0 ? 'mt-3' : 'mt-3'}`}>
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">{about.mission.title}</h3>
            <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">{about.mission.text}</p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">{about.why.title}</h3>
            <ul className="mt-3 space-y-2 text-sm sm:text-base text-gray-700">
              {about.why.bullets.map((line, index) => (
                <li key={index}>- {line}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7 text-center">
          <p className="text-base sm:text-lg font-semibold text-[#1f5f31]">{about.cta.text}</p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center justify-center rounded-xl bg-[#2f8444] px-5 py-3 text-sm font-semibold text-white hover:bg-[#256c38] transition w-full sm:w-auto"
            >
              {about.cta.browseListings}
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-[#2f8444] bg-white px-5 py-3 text-sm font-semibold text-[#2f8444] hover:bg-emerald-50 transition w-full sm:w-auto"
            >
              {about.cta.createAccount}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
