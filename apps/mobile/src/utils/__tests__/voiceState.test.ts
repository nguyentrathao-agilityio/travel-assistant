import { VOICE_STATES } from '../../constants';
import { resolveVoiceState } from '../voice';

const idleContext = { errorMessage: null, wsPhase: VOICE_STATES.IDLE };

test('an error wins over the connection phase', () => {
  expect(resolveVoiceState({ errorMessage: 'failed', wsPhase: VOICE_STATES.CONNECTING })).toBe(
    VOICE_STATES.ERROR
  );
});

test('resolves the speech-to-text connection phases', () => {
  expect(resolveVoiceState({ ...idleContext, wsPhase: VOICE_STATES.CONNECTING })).toBe(
    VOICE_STATES.CONNECTING
  );
  expect(resolveVoiceState({ ...idleContext, wsPhase: VOICE_STATES.LISTENING })).toBe(
    VOICE_STATES.LISTENING
  );
  expect(resolveVoiceState({ ...idleContext, wsPhase: VOICE_STATES.PROCESSING })).toBe(
    VOICE_STATES.PROCESSING
  );
  expect(resolveVoiceState(idleContext)).toBe(VOICE_STATES.IDLE);
});
