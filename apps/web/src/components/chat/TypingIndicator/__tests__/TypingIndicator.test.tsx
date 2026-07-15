import { render, screen } from '@testing-library/react';
import { TypingIndicator } from '../index';

describe('TypingIndicator', () => {
  describe('rendering', () => {
    it('renders with default label', () => {
      render(<TypingIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('AI is thinking')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<TypingIndicator label="Planning your trip…" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Planning your trip…');
      expect(screen.getByText('Planning your trip…')).toBeInTheDocument();
    });

    it('renders three animated dots', () => {
      const { container } = render(<TypingIndicator />);
      expect(container.querySelectorAll('.animate-bounce')).toHaveLength(3);
    });

    it('dots container is aria-hidden', () => {
      const { container } = render(<TypingIndicator />);
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      render(<TypingIndicator className="custom-class" />);
      expect(screen.getByRole('status')).toHaveClass('custom-class');
    });
  });
});
