import { Link } from 'react-router-dom';
import StarRating from './StarRating';

export default function ReviewCard({ review }) {
  const categories = [
    { key: 'cleanliness_rating', label: 'Cleanliness' },
    { key: 'communication_rating', label: 'Communication' },
    { key: 'timeliness_rating', label: 'Timeliness' },
  ].filter((c) => review[c.key] != null);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <Link
            to={`/profile/${review.reviewer_user_id}`}
            className="font-medium text-gray-900 hover:text-teal-700 transition text-sm"
          >
            {review.reviewer_username || 'Anonymous'}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
        <StarRating value={review.overall_rating} size="sm" />
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-2 text-xs">
          {categories.map(({ key, label }) => (
            <span key={key} className="flex items-center gap-1">
              <span className="text-gray-500">{label}:</span>
              <StarRating value={review[key]} max={5} size="sm" />
            </span>
          ))}
        </div>
      )}
      {review.comment && (
        <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
      )}
    </div>
  );
}

