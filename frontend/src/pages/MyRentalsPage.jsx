import FeatureUnavailablePage from '../components/FeatureUnavailablePage';
import { useTranslation } from '../lib/i18n';

export default function MyRentalsPage() {
  const { t } = useTranslation();

  return (
    <FeatureUnavailablePage
      title={t('requests.rentals.unavailable.title')}
      description={t('requests.rentals.unavailable.description')}
      backTo="/tenant-dashboard"
      backLabel={t('requests.rentals.unavailable.backLabel')}
    />
  );
}
