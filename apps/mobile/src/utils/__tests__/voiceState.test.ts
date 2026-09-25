import { VOICE_STATES } from '../../constants';
import { resolveVoiceState } from '../voice';

const idleContext = {
  errorMessage: null,
  isAgentRunning: false,
  isSpeaking: false,
  isVoiceTurnActive: false,
  wsPhase: VOICE_STATES.IDLE,
};

test('prioritizes errors and speaking over connection and agent states', () => {
  expect(
    resolveVoiceState({
      ...idleContext,
      errorMessage: 'failed',
      isSpeaking: true,
      wsPhase: VOICE_STATES.CONNECTING,
    })
  ).toBe(VOICE_STATES.ERROR);

  expect(
    resolveVoiceState({
      ...idleContext,
      isAgentRunning: true,
      isSpeaking: true,
      isVoiceTurnActive: true,
    })
  ).toBe(VOICE_STATES.SPEAKING);
});

test('resolves websocket, thinking, and idle states', () => {
  expect(resolveVoiceState({ ...idleContext, wsPhase: VOICE_STATES.CONNECTING })).toBe(
    VOICE_STATES.CONNECTING
  );
  expect(resolveVoiceState({ ...idleContext, wsPhase: VOICE_STATES.LISTENING })).toBe(
    VOICE_STATES.LISTENING
  );
  expect(
    resolveVoiceState({
      ...idleContext,
      isAgentRunning: true,
      isVoiceTurnActive: true,
    })
  ).toBe(VOICE_STATES.THINKING);
  expect(resolveVoiceState(idleContext)).toBe(VOICE_STATES.IDLE);
});
