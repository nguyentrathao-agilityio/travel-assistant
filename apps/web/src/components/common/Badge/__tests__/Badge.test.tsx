import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/common/Badge';

jest.mock('@/constants', () => ({}));

describe('Badge', () => {
  it('renders the label text', () => {
    render(<Badge variant="success" label="Cheapest" />);
    expect(screen.getByText('Cheapest')).toBeInTheDocument();
  });

  it('shows icon by default', () => {
    const { container } = render(<Badge variant="primary" label="Best" />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('hides icon when showIcon=false', () => {
    const { container } = render(<Badge variant="primary" label="Best" showIcon={false} />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('applies the success variant class', () => {
    const { container } = render(<Badge variant="success" label="OK" />);

    expect(container.firstChild).toHaveClass('bg-badge-success-bg');
  });

  it('applies the danger variant class', () => {
    const { container } = render(<Badge variant="danger" label="Danger" />);

    expect(container.firstChild).toHaveClass('bg-badge-danger-bg');
  });

  it('applies additional className', () => {
    const { container } = render(<Badge variant="primary" label="X" className="extra-class" />);

    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('renders all six variants without crashing', () => {
    const variants = ['success', 'primary', 'warning', 'secondary', 'accent', 'danger'] as const;

    variants.forEach((variant) => {
      const { unmount } = render(<Badge variant={variant} label={variant} />);

      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });
});
