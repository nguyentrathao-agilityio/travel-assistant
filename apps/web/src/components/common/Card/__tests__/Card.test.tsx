import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '@/components/common/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>card content</Card>);
    expect(screen.getByText('card content')).toBeInTheDocument();
  });

  it('uses the 14px card typography scale', () => {
    const { container } = render(<Card>card content</Card>);
    expect(container.firstChild).toHaveClass('card-typography');
  });

  it('has no role by default when not clickable', () => {
    const { container } = render(<Card>content</Card>);
    expect(container.firstChild).not.toHaveAttribute('role');
  });

  it('has role=button when onClick is provided', () => {
    render(<Card onClick={jest.fn()}>content</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Card onClick={onClick}>click me</Card>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Card onClick={onClick}>press enter</Card>);
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected border class when isSelected=true', () => {
    const { container } = render(<Card isSelected>selected</Card>);
    expect(container.firstChild).toHaveClass('border-border-info');
  });

  it('applies default border class when isSelected=false', () => {
    const { container } = render(<Card>default</Card>);
    expect(container.firstChild).toHaveClass('border-border-tertiary');
  });

  it('applies additional className', () => {
    const { container } = render(<Card className="custom">content</Card>);
    expect(container.firstChild).toHaveClass('custom');
  });
});
