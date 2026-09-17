import { buildHitlResponse, parseBookingApprovalRequest } from '../booking';

import {
  BOOKING_ACTIONS,
  BOOKING_APPROVAL_DECISIONS,
  BOOKING_APPROVAL_REQUEST_TYPE,
  BOOKING_DECISIONS,
  TOOL_NAMES,
} from '@repo/constants';

describe('buildHitlResponse', () => {
  const actionRequest = { name: TOOL_NAMES.BOOK_FLIGHT, args: { flightId: 'f1', price: 200 } };

  test('builds an approve payload with no extra data', () => {
    expect(buildHitlResponse(BOOKING_DECISIONS.APPROVE, actionRequest, 'rejected')).toEqual({
      decisions: [{ type: BOOKING_DECISIONS.APPROVE }],
    });
  });

  test('builds an edit payload merging edited details onto the original args', () => {
    const result = buildHitlResponse(BOOKING_DECISIONS.EDIT, actionRequest, 'rejected', {
      price: 250,
      note: null,
    });

    expect(result).toEqual({
      decisions: [
        {
          type: BOOKING_DECISIONS.EDIT,
          editedAction: {
            name: TOOL_NAMES.BOOK_FLIGHT,
            args: { flightId: 'f1', price: 250, note: null },
          },
        },
      ],
    });
  });

  test('falls back to a reject payload when edit is requested without edited details', () => {
    const result = buildHitlResponse(BOOKING_DECISIONS.EDIT, actionRequest, 'no details given');

    expect(result).toEqual({
      decisions: [{ type: BOOKING_DECISIONS.REJECT, message: 'no details given' }],
    });
  });

  test('builds a reject payload with the rejection message', () => {
    const result = buildHitlResponse(BOOKING_DECISIONS.REJECT, actionRequest, 'user declined');

    expect(result).toEqual({
      decisions: [{ type: BOOKING_DECISIONS.REJECT, message: 'user declined' }],
    });
  });
});

describe('parseBookingApprovalRequest', () => {
  const flightHitlPayload = {
    actionRequests: [
      {
        name: TOOL_NAMES.BOOK_FLIGHT,
        args: { flightId: 'f1', price: 200, note: null, extra: undefined },
        description: 'Book flight VN100',
      },
    ],
    reviewConfigs: [
      {
        actionName: TOOL_NAMES.BOOK_FLIGHT,
        allowedDecisions: [BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.EDIT],
      },
    ],
  };

  test('parses a flight booking approval request', () => {
    expect(parseBookingApprovalRequest(flightHitlPayload)).toEqual({
      type: BOOKING_APPROVAL_REQUEST_TYPE,
      approvalId: 'bookFlightTool:f1',
      draftId: 'bookFlightTool:f1',
      action: BOOKING_ACTIONS.CREATE_FLIGHT,
      title: 'Confirm flight booking',
      description: 'Book flight VN100',
      referenceId: 'f1',
      details: { flightId: 'f1', price: 200 },
      allowedDecisions: [BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.EDIT],
    });
  });

  test('parses a stringified JSON payload the same way', () => {
    expect(parseBookingApprovalRequest(JSON.stringify(flightHitlPayload))).toEqual(
      parseBookingApprovalRequest(flightHitlPayload)
    );
  });

  test('parses a hotel booking approval request', () => {
    const payload = {
      actionRequests: [
        { name: TOOL_NAMES.BOOK_HOTEL, args: { hotelId: 'h1' }, description: 'Book hotel' },
      ],
      reviewConfigs: [
        { actionName: TOOL_NAMES.BOOK_HOTEL, allowedDecisions: [BOOKING_DECISIONS.APPROVE] },
      ],
    };
    const result = parseBookingApprovalRequest(payload);

    expect(result?.action).toBe(BOOKING_ACTIONS.CREATE_HOTEL);
    expect(result?.title).toBe('Confirm hotel booking');
    expect(result?.referenceId).toBe('h1');
  });

  test('parses a cancellation approval request', () => {
    const payload = {
      actionRequests: [
        {
          name: TOOL_NAMES.CANCEL_BOOKING,
          args: { bookingId: 'b1' },
          description: 'Cancel booking',
        },
      ],
      reviewConfigs: [
        { actionName: TOOL_NAMES.CANCEL_BOOKING, allowedDecisions: [BOOKING_DECISIONS.APPROVE] },
      ],
    };
    const result = parseBookingApprovalRequest(payload);

    expect(result?.action).toBe(BOOKING_ACTIONS.CANCEL);
    expect(result?.title).toBe('Confirm booking cancellation');
    expect(result?.referenceId).toBe('b1');
  });

  test('falls back to the default allowed decisions when no matching review config exists', () => {
    const payload = {
      actionRequests: [
        { name: TOOL_NAMES.BOOK_FLIGHT, args: { flightId: 'f1' }, description: 'Book flight' },
      ],
      reviewConfigs: [],
    };

    expect(parseBookingApprovalRequest(payload)?.allowedDecisions).toEqual([
      ...BOOKING_APPROVAL_DECISIONS,
    ]);
  });

  test('produces an empty reference id when no known identifier arg is present', () => {
    const payload = {
      actionRequests: [{ name: TOOL_NAMES.BOOK_FLIGHT, args: {}, description: 'Book flight' }],
      reviewConfigs: [],
    };
    const result = parseBookingApprovalRequest(payload);

    expect(result?.referenceId).toBe('');
    expect(result?.approvalId).toBe('bookFlightTool:');
  });

  test('returns null for an unsupported tool name', () => {
    const payload = {
      actionRequests: [{ name: 'someOtherTool', args: { id: '1' }, description: 'Do something' }],
      reviewConfigs: [],
    };

    expect(parseBookingApprovalRequest(payload)).toBeNull();
  });

  test('returns null when there is not exactly one action request', () => {
    const zeroActions = { actionRequests: [], reviewConfigs: [] };
    const twoActions = {
      actionRequests: [
        { name: TOOL_NAMES.BOOK_FLIGHT, args: { flightId: 'f1' }, description: 'a' },
        { name: TOOL_NAMES.BOOK_HOTEL, args: { hotelId: 'h1' }, description: 'b' },
      ],
      reviewConfigs: [],
    };

    expect(parseBookingApprovalRequest(zeroActions)).toBeNull();
    expect(parseBookingApprovalRequest(twoActions)).toBeNull();
  });

  test('returns null for a payload that does not match the schema', () => {
    expect(parseBookingApprovalRequest({ foo: 'bar' })).toBeNull();
    expect(parseBookingApprovalRequest(null)).toBeNull();
    expect(parseBookingApprovalRequest('not json')).toBeNull();
    expect(parseBookingApprovalRequest(42)).toBeNull();
  });
});
