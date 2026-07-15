import { render, screen } from '@testing-library/react';
import { LoadingCard } from '@/components/common/LoadingCard';

describe('LoadingCard', () => {
  it('has role=status and aria-busy=true', () => {
    render(<LoadingCard />);
    const card = screen.getByRole('status');
    expect(card).toHaveAttribute('aria-busy', 'true');
  });

  it('has an accessible loading label', () => {
    render(<LoadingCard />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders the sr-only loading text', () => {
    render(<LoadingCard />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders the specified number of skeleton lines', () => {
    const { container } = render(<LoadingCard lines={5} />);
    const skeletonLines = container.querySelectorAll('[aria-hidden="true"].animate-pulse');
    expect(skeletonLines.length).toBeGreaterThanOrEqual(5);
  });

  it('applies additional className', () => {
    render(<LoadingCard className="extra" />);
    expect(screen.getByRole('status')).toHaveClass('extra');
  });
});
