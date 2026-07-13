import StaticPageHeader from '../components/StaticPageHeader';
import { useTranslation } from '../lib/i18n';

export default function CareersPage() {
  const { messages } = useTranslation();
  const careers = messages.careers;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaticPageHeader backLabel={careers.back} nav={careers.nav} />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2A7D4F]">{careers.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{careers.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">{careers.intro}</p>

        <div className="mt-8 space-y-4">
          {careers.openings.map((job) => (
            <article
              key={job.id}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {job.department} · {job.location} · {job.type}
                  </p>
                </div>
                <a
                  href={`mailto:samiuz2001@gmail.com?subject=${encodeURIComponent(job.applySubject)}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#2A7D4F] px-4 text-sm font-semibold text-white transition hover:bg-[#246341]"
                >
                  {careers.apply}
                </a>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">{job.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {job.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm text-gray-600">{careers.outro}</p>
      </main>
    </div>
  );
}
