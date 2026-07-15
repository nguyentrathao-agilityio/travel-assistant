import { render, screen } from '@testing-library/react';
import { ErrorCard } from '@/components/common/ErrorCard';

jest.mock('@/constants', () => ({}));

describe('ErrorCard', () => {
  it('renders the default error message', () => {
    render(<ErrorCard />);
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('renders a custom error message', () => {
    render(<ErrorCard message="Custom error occurred" />);
    expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
  });

  it('renders an alert icon', () => {
    const { container } = render(<ErrorCard />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
