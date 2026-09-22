import { useCallback, useState } from 'react';

interface UseConfirmedSelectionResult {
  confirmed: boolean;
  markChanged: () => void;
  markConfirmed: () => void;
}

// Tracks whether the current selection has been confirmed — shared by FlightCard and
// HotelCard, which otherwise duplicated this exact state machine byte-for-byte.
export const useConfirmedSelection = (initialConfirmed = false): UseConfirmedSelectionResult => {
  const [confirmed, setConfirmed] = useState(initialConfirmed);

  const markChanged = useCallback(() => setConfirmed(false), []);
  const markConfirmed = useCallback(() => setConfirmed(true), []);

  return { confirmed, markChanged, markConfirmed };
};
