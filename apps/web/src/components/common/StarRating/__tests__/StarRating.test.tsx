import { render, screen } from '@testing-library/react';
import { StarRating } from '@/components/common/StarRating';

jest.mock('@/constants', () => ({
  HOTEL_STAR_MAX: 5,
}));

describe('StarRating', () => {
  it('has accessible aria-label with star count', () => {
    render(<StarRating count={4} />);
    expect(screen.getByLabelText('4 stars')).toBeInTheDocument();
  });

  it('renders 5 star icons total', () => {
    const { container } = render(<StarRating count={3} />);
    const stars = container.querySelectorAll('[aria-hidden="true"]');

    expect(stars).toHaveLength(5);
  });

  it('renders filled stars for count=5', () => {
    const { container } = render(<StarRating count={5} />);
    const filled = container.querySelectorAll('.fill-badge-warning-text');

    expect(filled).toHaveLength(5);
  });

  it('renders no filled stars for count=0', () => {
    const { container } = render(<StarRating count={0} />);
    const filled = container.querySelectorAll('.fill-badge-warning-text');

    expect(filled).toHaveLength(0);
  });

  it('renders 3 filled and 2 empty stars for count=3', () => {
    const { container } = render(<StarRating count={3} />);
    const filled = container.querySelectorAll('.fill-badge-warning-text');
    const empty = container.querySelectorAll('.text-border-secondary');

    expect(filled).toHaveLength(3);
    expect(empty).toHaveLength(2);
  });
});
