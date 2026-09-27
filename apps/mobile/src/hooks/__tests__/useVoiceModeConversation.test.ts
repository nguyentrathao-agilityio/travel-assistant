import { act, renderHook } from '@testing-library/react-native';

import { useVoiceModeConversation } from '../useVoiceModeConversation';

import type { useVoiceAssistant } from '../useVoiceAssistant';
import type { Message } from '@copilotkit/react-native/headless';

type Voice = ReturnType<typeof useVoiceAssistant>;

interface Spies {
  cancelListening: jest.Mock;
  enqueueSpeech: jest.Mock;
  flushSpeech: jest.Mock;
  startListening: jest.Mock;
  stopListening: jest.Mock;
  stopSpeaking: jest.Mock;
}

const makeSpies = (): Spies => ({
  cancelListening: jest.fn(),
  enqueueSpeech: jest.fn(),
  flushSpeech: jest.fn(),
  startListening: jest.fn(),
  stopListening: jest.fn(),
  stopSpeaking: jest.fn(),
});

// All voice snapshots for a given test share the same spy functions, so
// asserting on a spy reflects every call regardless of which snapshot
// (voiceState) was current when the hook's effects fired.
const makeVoice = (spies: Spies, voiceState: Voice['voiceState'] = 'idle'): Voice => ({
  errorMessage: null,
  isPermissionDenied: false,
  micLevel: { value: 0 } as Voice['micLevel'],
  partialTranscript: '',
  voiceState,
  ...spies,
});

const renderConversation = async (props: {
  voice: Voice;
  messages: Message[];
  isRunning: boolean;
}) => renderHook((p: typeof props) => useVoiceModeConversation(p), { initialProps: props });

test('start activates the loop and begins listening', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result } = await renderConversation({ voice, messages: [], isRunning: false });

  await act(async () => {
    result.current.start();
  });

  expect(result.current.isActive).toBe(true);
  expect(spies.startListening).toHaveBeenCalledTimes(1);
});

test('stop deactivates the loop and halts listening/speaking', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result } = await renderConversation({ voice, messages: [], isRunning: false });

  await act(async () => {
    result.current.start();
  });
  await act(async () => {
    result.current.stop();
  });

  expect(result.current.isActive).toBe(false);
  expect(spies.cancelListening).toHaveBeenCalledTimes(1);
  expect(spies.stopSpeaking).toHaveBeenCalledTimes(1);
});

test('enqueues a completed sentence while the agent is still running', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result, rerender } = await renderConversation({
    voice,
    messages: [],
    isRunning: false,
  });

  await act(async () => {
    result.current.start();
  });

  const messages = [
    { id: 'assistant-1', role: 'assistant', content: 'First sentence. Still writing' },
  ] as unknown as Message[];

  await rerender({ voice, messages, isRunning: true });

  expect(spies.enqueueSpeech).toHaveBeenCalledWith('First sentence.');
  expect(spies.flushSpeech).toHaveBeenCalledTimes(1);
});

test('does not enqueue a completed sentence twice on repeated renders', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result, rerender } = await renderConversation({
    voice,
    messages: [],
    isRunning: false,
  });

  await act(async () => result.current.start());

  const messages = [
    { id: 'assistant-1', role: 'assistant', content: 'Only once.' },
  ] as unknown as Message[];

  await rerender({ voice, messages, isRunning: true });
  await rerender({ voice, messages: [...messages], isRunning: true });

  expect(spies.enqueueSpeech).toHaveBeenCalledTimes(1);
  expect(spies.enqueueSpeech).toHaveBeenCalledWith('Only once.');
});

test('flushes the final unpunctuated remainder when the agent finishes', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result, rerender } = await renderConversation({
    voice,
    messages: [],
    isRunning: false,
  });

  await act(async () => result.current.start());

  const messages = [
    { id: 'assistant-1', role: 'assistant', content: 'Final detail' },
  ] as unknown as Message[];

  await rerender({ voice, messages, isRunning: true });
  expect(spies.enqueueSpeech).not.toHaveBeenCalled();

  await rerender({ voice, messages, isRunning: false });
  await rerender({ voice, messages: [...messages], isRunning: false });

  expect(spies.enqueueSpeech).toHaveBeenCalledTimes(1);
  expect(spies.enqueueSpeech).toHaveBeenCalledWith('Final detail');
  expect(spies.flushSpeech).toHaveBeenCalledTimes(1);
});

test('enqueues multiple completed sentences in source order', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result, rerender } = await renderConversation({
    voice,
    messages: [],
    isRunning: false,
  });

  await act(async () => result.current.start());

  const messages = [
    { id: 'assistant-1', role: 'assistant', content: 'First. Second! Third?' },
  ] as unknown as Message[];

  await rerender({ voice, messages, isRunning: true });

  expect(spies.enqueueSpeech.mock.calls.map(([text]) => text)).toEqual([
    'First.',
    'Second!',
    'Third?',
  ]);
  expect(spies.flushSpeech).toHaveBeenCalledTimes(1);
});

test('waits for the agent to finish when speech drains before the stream', async () => {
  const spies = makeSpies();
  const { result, rerender } = await renderConversation({
    voice: makeVoice(spies),
    messages: [],
    isRunning: false,
  });

  await act(async () => result.current.start());
  spies.startListening.mockClear();

  const messages = [
    { id: 'assistant-1', role: 'assistant', content: 'A short sentence.' },
  ] as unknown as Message[];

  await rerender({ voice: makeVoice(spies), messages, isRunning: true });
  await rerender({ voice: makeVoice(spies, 'speaking'), messages, isRunning: true });
  await rerender({ voice: makeVoice(spies, 'idle'), messages, isRunning: true });

  expect(spies.startListening).not.toHaveBeenCalled();

  await rerender({ voice: makeVoice(spies, 'idle'), messages, isRunning: false });

  expect(spies.startListening).toHaveBeenCalledTimes(1);
});

test('stop resets streaming state and ignores later snapshots', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result, rerender } = await renderConversation({
    voice,
    messages: [],
    isRunning: false,
  });

  await act(async () => result.current.start());

  const first = [
    { id: 'assistant-1', role: 'assistant', content: 'Before stop.' },
  ] as unknown as Message[];

  await rerender({ voice, messages: first, isRunning: true });
  await act(async () => result.current.stop());

  const afterStop = [
    { id: 'assistant-1', role: 'assistant', content: 'Before stop. After stop.' },
  ] as unknown as Message[];

  await rerender({ voice, messages: afterStop, isRunning: true });

  expect(spies.enqueueSpeech.mock.calls.map(([text]) => text)).toEqual(['Before stop.']);
});

test('skips speaking and resumes listening when the finished turn has no assistant text', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { result, rerender } = await renderConversation({
    voice,
    messages: [],
    isRunning: false,
  });

  await act(async () => {
    result.current.start();
  });

  const messages = [
    { id: '1', role: 'assistant', content: '', toolCalls: [{ id: 'call-1' }] },
  ] as unknown as Message[];

  await rerender({ voice, messages, isRunning: true });
  await rerender({ voice, messages, isRunning: false });

  expect(spies.enqueueSpeech).not.toHaveBeenCalled();
  expect(spies.startListening).toHaveBeenCalledTimes(2); // once from start(), once from the resume
});

test('does not react to the agent finishing while inactive', async () => {
  const spies = makeSpies();
  const voice = makeVoice(spies);
  const { rerender } = await renderConversation({ voice, messages: [], isRunning: false });

  const messages = [{ id: '1', role: 'assistant', content: 'Hello' }] as unknown as Message[];

  await rerender({ voice, messages, isRunning: true });
  await rerender({ voice, messages, isRunning: false });

  expect(spies.enqueueSpeech).not.toHaveBeenCalled();
});

test('resumes listening once speaking finishes, while active', async () => {
  const spies = makeSpies();
  const { result, rerender } = await renderConversation({
    voice: makeVoice(spies, 'speaking'),
    messages: [],
    isRunning: false,
  });

  await act(async () => {
    result.current.start();
  });

  await rerender({ voice: makeVoice(spies, 'idle'), messages: [], isRunning: false });

  expect(spies.startListening).toHaveBeenCalled();
});

test('does not auto-retry when speaking ends in an error state', async () => {
  const spies = makeSpies();
  const { result, rerender } = await renderConversation({
    voice: makeVoice(spies, 'speaking'),
    messages: [],
    isRunning: false,
  });

  await act(async () => {
    result.current.start();
  });
  spies.startListening.mockClear(); // drop the call() made by start()

  await rerender({ voice: makeVoice(spies, 'error'), messages: [], isRunning: false });

  expect(spies.startListening).not.toHaveBeenCalled();
});
