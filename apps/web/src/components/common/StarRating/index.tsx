import { Star } from 'lucide-react';

// Constants
import { HOTEL_STAR_MAX } from '@/constants';

interface StarRatingProps {
  count: number;
}

const StarRating = ({ count }: StarRatingProps) => (
  <span className="flex items-center gap-0.5" aria-label={`${count} stars`}>
    {Array.from({ length: HOTEL_STAR_MAX }).map((_, index) => (
      <Star
        key={`star-${index}`}
        size={10}
        aria-hidden="true"
        className={
          index < count
            ? 'text-badge-warning-text fill-badge-warning-text'
            : 'text-border-secondary'
        }
      />
    ))}
  </span>
);

export { StarRating };
