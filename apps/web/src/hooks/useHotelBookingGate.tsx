import { useEffect, useRef } from 'react';
import { useHumanInTheLoop } from '@copilotkit/react-core';
import { ACTIONS } from '@/constants';
import { Building2 } from 'lucide-react';

// Hooks
import { useTripState } from './useTripState';

// Components
import { Button, Typography } from '@/components';

// Utils
import { cn } from '@/utils';

const AutoSkip = ({ respond }: { respond: (v: unknown) => void }) => {
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      respond({ action: 'skip' });
    }
  }, [respond]);
  return null;
};

const HotelGateUI = ({ respond }: { respond: (v: unknown) => void }) => {
  const { state } = useTripState();
  const hasHotelSelected = !!state.hotel;

  return (
    <div
      className={cn(
        'border-border-secondary bg-background-secondary flex w-full max-w-2xl items-center justify-between gap-3 rounded-lg border px-4 py-3'
      )}
    >
      <div className="flex items-center gap-2">
        <Building2 size={14} className="text-text-secondary shrink-0" aria-hidden="true" />
        <Typography variant="body" color="secondary">
          Select a hotel from the options above, then continue.
        </Typography>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => respond({ action: 'skip' })}>
          Skip hotel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!hasHotelSelected}
          onClick={() => respond({ action: 'confirm' })}
        >
          Continue ↗
        </Button>
      </div>
    </div>
  );
};

/**
 * HITL gate — pauses the agent after hotel results during a FULL-TRIP booking flow.
 * The agent must pass mode="full-trip" to activate the gate UI.
 * Any other call (standalone hotel search) is auto-skipped transparently.
 */
export const useHotelBookingGate = () => {
  useHumanInTheLoop({
    name: ACTIONS.WAIT_FOR_HOTEL_BOOKING,
    description:
      'Sequential-booking gate. Call this after search-hotels ONLY during the full-trip flow — pass mode="full-trip". Standalone hotel searches must NOT call this gate.',
    parameters: [
      {
        name: 'mode',
        type: 'string',
        description:
          'Must be "full-trip" to activate the gate. Omit or use any other value for standalone searches.',
        required: false,
      },
    ],
    render: ({ args, respond }) => {
      if (!respond) return <></>;

      if (args?.mode !== 'full-trip') {
        return <AutoSkip respond={respond} />;
      }

      return <HotelGateUI respond={respond} />;
    },
  });
};
