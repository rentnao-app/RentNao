import { Link } from 'react-router-dom';
import BrandLogoLink from './BrandLogoLink';
import { useTranslation } from '../lib/i18n';

export default function FeatureUnavailablePage({
  title,
  description,
  backTo = '/',
  backLabel,
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('components.featureUnavailable.title');
  const resolvedDescription = description ?? t('components.featureUnavailable.description');
  const resolvedBackLabel = backLabel ?? t('components.featureUnavailable.goBack');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          <Link to={backTo} className="text-sm font-medium text-teal-700 hover:text-teal-800">
            {resolvedBackLabel}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{resolvedTitle}</h1>
          <p className="text-gray-600 mb-6">{resolvedDescription}</p>
          <p className="text-sm text-gray-500">
            {t('components.featureUnavailable.footerNote')}
          </p>
        </div>
      </main>
    </div>
  );
}
