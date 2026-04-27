import FeatureUnavailablePage from '../components/FeatureUnavailablePage';

export default function MyRentalsPage() {
  return (
    <FeatureUnavailablePage
      title="Rentals Timeline Unavailable"
      description="Rental lifecycle and review features are currently unavailable because rental and review endpoints are not in the active backend API contract."
      backTo="/tenant-dashboard"
      backLabel="Back to Dashboard"
    />
  );
}

