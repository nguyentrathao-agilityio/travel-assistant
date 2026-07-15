import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleSection } from '../index';
import type { LocalTip } from '@/components/common';

const tips: LocalTip[] = [
  { text: 'Tip one', icon: undefined },
  { text: 'Tip two', icon: undefined },
];

describe('CollapsibleSection', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      render(<CollapsibleSection title="Local tips" tips={tips} />);
      expect(screen.getByText('Local tips')).toBeInTheDocument();
    });

    it('is collapsed by default', () => {
      render(<CollapsibleSection title="Local tips" tips={tips} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('is expanded when defaultOpen is true', () => {
      render(<CollapsibleSection title="Local tips" tips={tips} defaultOpen />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders "No tips available." when tips list is empty and expanded', () => {
      render(<CollapsibleSection title="Local tips" tips={[]} defaultOpen />);
      expect(screen.getByText('No tips available.')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      const { container } = render(
        <CollapsibleSection title="Tips" tips={[]} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('toggle behaviour', () => {
    it('expands when the header is clicked', async () => {
      const user = userEvent.setup();
      render(<CollapsibleSection title="Tips" tips={tips} />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses after being expanded', async () => {
      const user = userEvent.setup();
      render(<CollapsibleSection title="Tips" tips={tips} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows tips when expanded', async () => {
      const user = userEvent.setup();
      render(<CollapsibleSection title="Tips" tips={tips} />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Tip one')).toBeInTheDocument();
      expect(screen.getByText('Tip two')).toBeInTheDocument();
    });
  });
});
