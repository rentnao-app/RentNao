import AppHeader from '../components/AppHeader';
import { useTranslation } from '../lib/i18n';
import { homeSectionInner } from '../components/home/homeLayout';

export default function ContactPage() {
  const { messages } = useTranslation();
  const copy = messages.contact;

  const rows = [
    { label: copy.nameLabel, value: copy.nameValue },
    {
      label: copy.emailLabel,
      value: copy.emailValue,
      href: `mailto:${copy.emailValue}`,
    },
    {
      label: copy.phoneLabel,
      value: copy.phoneValue,
      href: `tel:${String(copy.phoneValue || '').replace(/[^\d+]/g, '')}`,
    },
    { label: copy.addressLabel, value: copy.addressValue },
  ];

  return (
    <div className="min-h-screen bg-[#f3f7f4] text-[#1a4728]">
      <AppHeader centerNav />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-interior-1.png')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#123528]/78" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2f22]/90 via-[#123528]/70 to-[#123528]/45" aria-hidden />

        <div className={`relative ${homeSectionInner} py-16 sm:py-20 lg:py-24`}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b7dcc8]">{copy.brand}</p>
          <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">{copy.subtitle}</p>
        </div>
      </section>

      <section className={`${homeSectionInner} py-12 sm:py-16`}>
        <dl className="mx-auto max-w-xl divide-y divide-[#d5e3db] border-y border-[#d5e3db]">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-1 gap-1 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6 sm:py-6">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#2A7D4F] sm:pt-1">
                {row.label}
              </dt>
              <dd className="text-base font-medium text-[#1a4728] sm:text-lg">
                {row.href ? (
                  <a href={row.href} className="transition hover:text-[#2A7D4F] hover:underline">
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
