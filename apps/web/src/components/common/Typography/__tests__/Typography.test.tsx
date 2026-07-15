import { render, screen } from '@testing-library/react';
import { Typography } from '@/components/common/Typography';

jest.mock('@/constants', () => ({}));

describe('Typography', () => {
  it('renders children text', () => {
    render(<Typography>Hello world</Typography>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as <p> by default', () => {
    const { container } = render(<Typography>text</Typography>);
    expect(container.querySelector('p')).toBeInTheDocument();
  });

  it('renders as a different element via as prop', () => {
    const { container } = render(<Typography as="span">span text</Typography>);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('applies medium weight class', () => {
    const { container } = render(<Typography weight="medium">medium</Typography>);
    expect((container.firstChild as HTMLElement).className).toContain('font-medium');
  });

  it('applies primary color class by default', () => {
    const { container } = render(<Typography>text</Typography>);
    expect((container.firstChild as HTMLElement).className).toContain('text-text-primary');
  });

  it('applies secondary color class', () => {
    const { container } = render(<Typography color="secondary">secondary</Typography>);
    expect((container.firstChild as HTMLElement).className).toContain('text-text-secondary');
  });

  it('applies tertiary color class', () => {
    const { container } = render(<Typography color="tertiary">tertiary</Typography>);
    expect((container.firstChild as HTMLElement).className).toContain('text-text-tertiary');
  });

  it('applies additional className', () => {
    const { container } = render(<Typography className="extra">text</Typography>);
    expect(container.firstChild).toHaveClass('extra');
  });
});
