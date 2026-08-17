import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatEmptyState } from '../index';

describe('ChatEmptyState', () => {
  describe('rendering', () => {
    it('renders the tagline', () => {
      render(<ChatEmptyState onSuggestionClick={jest.fn()} />);
      expect(screen.getByText(/I'll help you plan the trip/i)).toBeInTheDocument();
    });

    it('renders destination pills', () => {
      render(<ChatEmptyState onSuggestionClick={jest.fn()} />);
      expect(screen.getByText('Da Nang')).toBeInTheDocument();
      expect(screen.getByText('Hanoi')).toBeInTheDocument();
    });

    it('renders the primary suggestion card title', () => {
      render(<ChatEmptyState onSuggestionClick={jest.fn()} />);
      expect(screen.getByText('Plan my trip')).toBeInTheDocument();
    });

    it('renders secondary suggestion cards', () => {
      render(<ChatEmptyState onSuggestionClick={jest.fn()} />);
      expect(screen.getByText('Find places')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onSuggestionClick with primary suggestion message when clicked', async () => {
      const onSuggestionClick = jest.fn();
      const user = userEvent.setup();

      render(<ChatEmptyState onSuggestionClick={onSuggestionClick} />);
      await user.click(screen.getByText('Plan my trip'));
      expect(onSuggestionClick).toHaveBeenCalledWith('Plan a trip to Da Nang');
    });

    it('calls onSuggestionClick with secondary suggestion message when clicked', async () => {
      const onSuggestionClick = jest.fn();
      const user = userEvent.setup();

      render(<ChatEmptyState onSuggestionClick={onSuggestionClick} />);
      await user.click(screen.getByText('Find places'));
      expect(onSuggestionClick).toHaveBeenCalledWith('Show me places to visit in Da Nang');
    });

    it('calls onSuggestionClick with city prefill when a destination pill is clicked', async () => {
      const onSuggestionClick = jest.fn();
      const user = userEvent.setup();

      render(<ChatEmptyState onSuggestionClick={onSuggestionClick} />);
      await user.click(screen.getByText('Da Nang'));
      expect(onSuggestionClick).toHaveBeenCalledWith('Plan a trip to Da Nang');
    });
  });
});
