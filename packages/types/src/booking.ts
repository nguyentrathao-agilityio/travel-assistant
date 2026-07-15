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
