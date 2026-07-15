import { render, screen } from '@testing-library/react';
import { StepBadge } from '@/components/common/StepBadge';

jest.mock('@/constants', () => ({}));

describe('StepBadge', () => {
  it('renders the step index', () => {
    render(<StepBadge index={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('has aria-label with the step number', () => {
    render(<StepBadge index={2} />);
    expect(screen.getByLabelText('Step 2')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    render(<StepBadge index={1} className="extra" />);
    expect(screen.getByLabelText('Step 1')).toHaveClass('extra');
  });
});
