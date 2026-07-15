import { render, screen } from '@testing-library/react';
import { Divider } from '@/components/common/Divider';

jest.mock('@/constants', () => ({}));

describe('Divider', () => {
  it('renders a horizontal separator by default', () => {
    render(<Divider />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders a vertical separator', () => {
    render(<Divider orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('renders children text between horizontal lines', () => {
    render(<Divider>or</Divider>);
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(<Divider className="my-custom" />);
    expect(container.firstChild).toHaveClass('my-custom');
  });
});
