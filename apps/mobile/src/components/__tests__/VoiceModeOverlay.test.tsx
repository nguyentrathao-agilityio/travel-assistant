import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BOOKING_DECISIONS, TOOL_NAMES } from '@repo/constants';

import { VoiceModeOverlay } from '../VoiceModeOverlay';
import { ThemeProvider } from '../../theme';

import type { VoiceState } from '../../hooks';

const flightApproval = {
  actionRequests: [
    {
      name: TOOL_NAMES.BOOK_FLIGHT,
      args: { flightId: 'f1', origin: 'SGN' },
      description: 'Book flight VN100',
    },
  ],
  reviewConfigs: [],
};

const renderOverlay = async (
  overrides: Partial<{
    agentTranscript: string;
    errorMessage: string | null;
    pendingApproval: unknown;
    voiceState: VoiceState;
  }> = {}
) => {
  const onApprovalDecision = jest.fn();

  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { height: 800, width: 400, x: 0, y: 0 },
        insets: { bottom: 0, left: 0, right: 0, top: 0 },
      }}
    >
      <ThemeProvider>
        <VoiceModeOverlay
          agentTranscript={overrides.agentTranscript ?? ''}
          errorMessage={overrides.errorMessage ?? null}
          micLevel={{ value: 0 } as never}
          onApprovalDecision={onApprovalDecision}
          onExit={jest.fn()}
          onStopTurn={jest.fn()}
          partialTranscript=""
          pendingApproval={overrides.pendingApproval ?? null}
          voiceState={overrides.voiceState ?? 'listening'}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return { onApprovalDecision };
};

test('shows the booking approval card and resumes with the approve payload', async () => {
  const user = userEvent.setup();
  const { onApprovalDecision } = await renderOverlay({
    pendingApproval: flightApproval,
    voiceState: 'awaiting_approval',
  });

  expect(screen.getByText('Confirm flight booking')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Confirm booking' }));

  expect(onApprovalDecision).toHaveBeenCalledWith({
    decisions: [{ type: BOOKING_DECISIONS.APPROVE }],
  });
});

test('shows the streamed assistant reply as the caption', async () => {
  await renderOverlay({ agentTranscript: 'Sunny tomorrow.', voiceState: 'speaking' });

  expect(screen.getByText('Sunny tomorrow.')).toBeOnTheScreen();
});

test('shows a recoverable hint while still listening', async () => {
  await renderOverlay({ errorMessage: "Didn't catch that.", voiceState: 'listening' });

  expect(screen.getByText("Didn't catch that.")).toBeOnTheScreen();
});

test('shows the listening label, not the previous reply, once listening resumes', async () => {
  await renderOverlay({ agentTranscript: 'Sunny tomorrow.', voiceState: 'listening' });

  expect(screen.getByText('Listening…')).toBeOnTheScreen();
  expect(screen.queryByText('Sunny tomorrow.')).toBeNull();
});
