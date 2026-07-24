import { render, screen } from '@testing-library/react';

import { BookingDecisionCard } from '../index';

describe('BookingDecisionCard', () => {
  it('explains that a rejected booking was not submitted', () => {
    render(<BookingDecisionCard action="hotel" />);

    expect(screen.getByText('Booking not submitted')).toBeInTheDocument();
    expect(
      screen.getByText('Update your selection or traveler details, then try again.')
    ).toBeInTheDocument();
  });

  it('explains that a rejected cancellation leaves the booking active', () => {
    render(<BookingDecisionCard action="cancellation" />);

    expect(screen.getByText('Cancellation not submitted')).toBeInTheDocument();
    expect(screen.getByText('Your booking remains active.')).toBeInTheDocument();
  });
});
