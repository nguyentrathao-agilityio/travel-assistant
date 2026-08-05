export type BookingType = 'flight' | 'hotel';
export type BookingStatus = 'confirmed' | 'cancelled';

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

export type BookingDecision = 'approve' | 'edit' | 'reject';

export interface BookingApprovalRequest {
  type: 'booking_approval';
  approvalId: string;
  /** Stable draft identifier. Optional only for checkpoints created before HITL draft IDs. */
  draftId?: string;
  action: 'create_flight_booking' | 'create_hotel_booking' | 'cancel_booking';
  title: string;
  description: string;
  referenceId: string;
  details: Record<string, string | number | boolean | null>;
  totalPrice?: number;
  currency?: string;
  allowedDecisions: BookingDecision[];
}

export interface BookingApprovalResponse {
  decision: BookingDecision;
  approvalId: string;
  edits?: Record<string, string | number>;
}
