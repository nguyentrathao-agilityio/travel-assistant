import { render, screen } from '@testing-library/react';

// Components
import { ToolCompletedCard } from '@/components/common/ToolCompletedCard';

describe('ToolCompletedCard', () => {
  it('renders the completed tool message in a card', () => {
    render(<ToolCompletedCard message="Transfer to book hotel tool completed." />);

    expect(screen.getByText('Transfer to book hotel tool completed.')).toBeInTheDocument();
  });

  it('renders a decorative success icon', () => {
    const { container } = render(<ToolCompletedCard message="Tool completed." />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
