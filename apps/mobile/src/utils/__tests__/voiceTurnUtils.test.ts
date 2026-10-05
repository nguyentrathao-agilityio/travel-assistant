import { VOICE_ERROR_MESSAGES, VOICE_STATES } from '../../constants';
import { toAgUiMessages } from '../langgraphMessage';
import {
  formatClipDuration,
  parseVoiceTurnEvent,
  resolveServerVoiceState,
  voiceTurnErrorMessage,
  voiceTurnRequestErrorMessage,
} from '../voice';

const idleTurn = { isRunning: false, isSpeaking: false, pendingApproval: null };

describe('resolveServerVoiceState', () => {
  it('prefers approval, then speaking, then thinking, then the STT state', () => {
    expect(
      resolveServerVoiceState(
        { isRunning: true, isSpeaking: true, pendingApproval: {} },
        VOICE_STATES.LISTENING
      )
    ).toBe(VOICE_STATES.AWAITING_APPROVAL);
    expect(
      resolveServerVoiceState({ ...idleTurn, isSpeaking: true, isRunning: true }, 'idle')
    ).toBe(VOICE_STATES.SPEAKING);
    expect(resolveServerVoiceState({ ...idleTurn, isRunning: true }, 'idle')).toBe(
      VOICE_STATES.THINKING
    );
    expect(resolveServerVoiceState(idleTurn, VOICE_STATES.LISTENING)).toBe(VOICE_STATES.LISTENING);
  });
});

describe('voice turn error messages', () => {
  it('maps agent_end codes', () => {
    expect(voiceTurnErrorMessage('invalid_key')).toBe(VOICE_ERROR_MESSAGES.INVALID_KEY);
    expect(voiceTurnErrorMessage('thread_busy')).toBe(VOICE_ERROR_MESSAGES.THREAD_BUSY);
    expect(voiceTurnErrorMessage('anything_else')).toBe(VOICE_ERROR_MESSAGES.AGENT_FAILED);
  });

  it('maps request failures', () => {
    expect(voiceTurnRequestErrorMessage({ code: 'missing_key' })).toBe(
      VOICE_ERROR_MESSAGES.INVALID_KEY
    );
    expect(voiceTurnRequestErrorMessage(new TypeError('Network request failed'))).toBe(
      VOICE_ERROR_MESSAGES.CONNECTION_LOST
    );
  });
});

describe('parseVoiceTurnEvent', () => {
  it('returns valid events and null for unknown or malformed ones', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(parseVoiceTurnEvent('{"type":"speech_end"}')).toEqual({ type: 'speech_end' });
    expect(parseVoiceTurnEvent('{"type":"nope"}')).toBeNull();
    expect(parseVoiceTurnEvent('{not json')).toBeNull();
  });
});

describe('toAgUiMessages', () => {
  it('converts thread values to chat messages and tolerates missing values', () => {
    const messages = toAgUiMessages('thread-1', {
      messages: [
        { content: 'hi', id: 'h1', type: 'human' },
        { content: 'Hello', id: 'a1', type: 'ai' },
      ],
    });

    expect(messages).toEqual([
      expect.objectContaining({ id: 'h1', role: 'user' }),
      expect.objectContaining({ id: 'a1', role: 'assistant' }),
    ]);
    expect(toAgUiMessages('thread-1', undefined)).toEqual([]);
  });
});

describe('formatClipDuration', () => {
  it('formats as m:ss and rounds short clips up to one second', () => {
    expect(formatClipDuration(300)).toBe('0:01');
    expect(formatClipDuration(4200)).toBe('0:05');
    expect(formatClipDuration(65_000)).toBe('1:05');
  });
});
