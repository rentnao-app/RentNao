import { useMemo, useState } from 'react';
import StarRating from './StarRating';
import { useTranslation } from '../lib/i18n';

const CATEGORY_KEYS = [
  { key: 'overall_rating', labelKey: 'reviews.categories.overall', required: true },
  { key: 'cleanliness_rating', labelKey: 'reviews.categories.cleanliness', required: false },
  { key: 'communication_rating', labelKey: 'reviews.categories.communication', required: false },
  { key: 'timeliness_rating', labelKey: 'reviews.categories.timeliness', required: false },
];

export default function ReviewForm({ rentalId, onSuccess, onCancel, submitReview }) {
  const { t } = useTranslation();
  const categories = useMemo(
    () => CATEGORY_KEYS.map(({ key, labelKey, required }) => ({ key, label: t(labelKey), required })),
    [t]
  );
  const [form, setForm] = useState({
    overall_rating: 0,
    cleanliness_rating: 0,
    communication_rating: 0,
    timeliness_rating: 0,
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.overall_rating < 1 || form.overall_rating > 5) {
      setError(t('reviews.form.overallRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitReview({
        rental_id: rentalId,
        overall_rating: form.overall_rating,
        cleanliness_rating: form.cleanliness_rating || undefined,
        communication_rating: form.communication_rating || undefined,
        timeliness_rating: form.timeliness_rating || undefined,
        comment: form.comment.trim() || undefined,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || t('reviews.form.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {categories.map(({ key, label, required }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && '*'}
          </label>
          <StarRating
            value={form[key]}
            interactive
            onChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reviews.form.commentLabel')}</label>
        <textarea
          value={form.comment}
          onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          rows={3}
          placeholder={t('reviews.form.commentPlaceholder')}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium transition disabled:opacity-50"
        >
          {loading ? t('reviews.form.submitting') : t('reviews.form.submitReview')}
        </button>
      </div>
    </form>
  );
}
