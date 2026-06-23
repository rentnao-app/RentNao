import { useTranslation } from '../../lib/i18n';

export default function AdminPlaceholderSection({ title, description }) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <p className="mt-4 text-sm text-slate-500">{t('admin.settings.placeholder')}</p>
    </section>
  );
}
