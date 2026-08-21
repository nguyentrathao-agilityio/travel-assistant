import {
  BOOKING_ACTIONS,
  BOOKING_APPROVAL_REQUEST_TYPE,
  BOOKING_DECISIONS,
  BOOKING_STATUSES,
  BOOKING_TYPES,
} from '@repo/constants';

export type BookingType = (typeof BOOKING_TYPES)[keyof typeof BOOKING_TYPES];
export type BookingStatus = (typeof BOOKING_STATUSES)[keyof typeof BOOKING_STATUSES];

export interface Booking {
  id: string;
  confirmationCode: string;
  type: BookingType;
  referenceId: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
  summary: string;
}

export type BookingDecision = (typeof BOOKING_DECISIONS)[keyof typeof BOOKING_DECISIONS];
export type BookingAction = (typeof BOOKING_ACTIONS)[keyof typeof BOOKING_ACTIONS];

export interface BookingApprovalRequest {
  type: typeof BOOKING_APPROVAL_REQUEST_TYPE;
  approvalId: string;
  /** Stable draft identifier. Optional only for checkpoints created before HITL draft IDs. */
  draftId?: string;
  action: BookingAction;
  title: string;
  description: string;
  referenceId: string;
  details: Record<string, string | number | boolean | null>;
  totalPrice?: number;
  currency?: string;
  allowedDecisions: BookingDecision[];
}
