import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { BookingApprovalCard } from '../BookingApprovalCard';
import { ThemeProvider } from '../../theme';
import { BOOKING_ACTIONS, BOOKING_APPROVAL_REQUEST_TYPE, BOOKING_DECISIONS } from '@repo/constants';
import { formatPrice } from '@repo/utils';

import type { BookingApprovalRequest } from '@repo/types';

const baseRequest: BookingApprovalRequest = {
  type: BOOKING_APPROVAL_REQUEST_TYPE,
  approvalId: 'appr-1',
  action: BOOKING_ACTIONS.CREATE_FLIGHT,
  title: 'Confirm flight booking',
  description: 'Review before booking',
  referenceId: 'FL1',
  details: { flightId: 'FL1', origin: 'SGN', destination: 'HAN' },
  totalPrice: 1200000,
  currency: 'VND',
  allowedDecisions: [BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.EDIT, BOOKING_DECISIONS.REJECT],
};

test('renders the request title, details and total price', async () => {
  await render(
    <ThemeProvider>
      <BookingApprovalCard onDecision={jest.fn()} request={baseRequest} />
    </ThemeProvider>
  );

  expect(screen.getByText('Confirm flight booking')).toBeOnTheScreen();
  expect(screen.getByText('ORIGIN')).toBeOnTheScreen();
  expect(screen.getByText('SGN')).toBeOnTheScreen();
  expect(screen.getByText(formatPrice(1200000, 'VND'))).toBeOnTheScreen();
});

test('omits the total row when no price is given', async () => {
  await render(
    <ThemeProvider>
      <BookingApprovalCard
        onDecision={jest.fn()}
        request={{ ...baseRequest, totalPrice: undefined, currency: undefined }}
      />
    </ThemeProvider>
  );

  expect(screen.queryByText('Total')).not.toBeOnTheScreen();
});

test('rejects the booking', async () => {
  const onDecision = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <BookingApprovalCard onDecision={onDecision} request={baseRequest} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Cancel' }));

  expect(onDecision).toHaveBeenCalledWith(BOOKING_DECISIONS.REJECT);
  expect(screen.getByText('Submitting…')).toBeOnTheScreen();
});

test('confirms the booking without edits', async () => {
  const onDecision = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <BookingApprovalCard onDecision={onDecision} request={baseRequest} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Confirm booking' }));

  expect(onDecision).toHaveBeenCalledWith(BOOKING_DECISIONS.APPROVE, undefined);
});

test('renders a cancellation request without an edit option', async () => {
  const onDecision = jest.fn();
  const user = userEvent.setup();
  const cancelRequest: BookingApprovalRequest = {
    ...baseRequest,
    action: BOOKING_ACTIONS.CANCEL,
    allowedDecisions: [BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.REJECT],
  };

  await render(
    <ThemeProvider>
      <BookingApprovalCard onDecision={onDecision} request={cancelRequest} />
    </ThemeProvider>
  );

  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Keep booking' })).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Cancel booking' }));

  expect(onDecision).toHaveBeenCalledWith(BOOKING_DECISIONS.APPROVE, undefined);
});

test('edits an editable field and submits the change', async () => {
  const onDecision = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <BookingApprovalCard onDecision={onDecision} request={baseRequest} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Edit' }));

  expect(screen.queryByLabelText('flightId')).not.toBeOnTheScreen();

  const input = screen.getByLabelText('origin');

  await user.clear(input);
  await user.type(input, 'HCM');
  await user.press(screen.getByRole('button', { name: 'Save changes' }));
  await user.press(screen.getByRole('button', { name: 'Confirm booking' }));

  expect(onDecision).toHaveBeenCalledWith(BOOKING_DECISIONS.EDIT, {
    flightId: 'FL1',
    origin: 'HCM',
    destination: 'HAN',
  });
});

test('discards edits and keeps the original value', async () => {
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <BookingApprovalCard onDecision={jest.fn()} request={baseRequest} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Edit' }));

  const input = screen.getByLabelText('origin');

  await user.clear(input);
  await user.type(input, 'ZZZ');
  await user.press(screen.getByRole('button', { name: 'Discard changes' }));

  expect(screen.getByText('SGN')).toBeOnTheScreen();
  expect(screen.queryByText('ZZZ')).not.toBeOnTheScreen();
});

test('shows a timeout error if the decision takes too long', async () => {
  jest.useFakeTimers();

  await render(
    <ThemeProvider>
      <BookingApprovalCard onDecision={jest.fn()} request={baseRequest} />
    </ThemeProvider>
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Confirm booking' }));

  await act(async () => {
    jest.advanceTimersByTime(20000);
  });

  expect(screen.getByText(/taking longer than expected/i)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Confirm booking' })).toBeEnabled();

  jest.useRealTimers();
});
