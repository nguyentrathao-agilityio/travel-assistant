import { render, screen } from '@testing-library/react';
import { TipRow } from '@/components/common/TipRow';
import { MapPin } from 'lucide-react';

describe('TipRow', () => {
  it('renders the tip text', () => {
    render(<TipRow text="Tip: Book in advance" />);
    expect(screen.getByText('Tip: Book in advance')).toBeInTheDocument();
  });

  it('renders the default Info icon when no icon prop is provided', () => {
    const { container } = render(<TipRow text="some tip" />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders a custom icon when provided', () => {
    const { container } = render(<TipRow text="tip" icon={MapPin} />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders as a list item', () => {
    render(
      <ul>
        <TipRow text="list tip" />
      </ul>
    );
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });
});
