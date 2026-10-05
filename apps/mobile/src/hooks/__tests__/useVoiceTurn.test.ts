import { act, renderHook } from '@testing-library/react-native';

import { VOICE_ERROR_MESSAGES } from '../../constants';
import { useVoiceTurn } from '../useVoiceTurn';

import type { VoiceTurnEvent } from '@repo/schemas';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('../../storage', () => ({ getApiKey: jest.fn().mockResolvedValue('sk-test') }));

interface StreamCall {
  body: unknown;
  signal: AbortSignal;
  emit(event: VoiceTurnEvent): void;
  finish(): void;
  fail(error: unknown): void;
}

const fakeQueue = () => {
  const finishers: Array<() => void> = [];
  const spoken: string[] = [];
  const stop = jest.fn();

  return {
    deps: {
      speak: (text: string, { onDone }: { onDone: () => void }) => {
        spoken.push(text);
        finishers.push(onDone);
      },
      stop,
    },
    finishers,
    spoken,
    stop,
  };
};

const controllableStream = () => {
  const calls: StreamCall[] = [];
  const stream = jest.fn(
    ({
      body,
      signal,
      onEvent,
    }: {
      body: unknown;
      signal: AbortSignal;
      onEvent(event: VoiceTurnEvent): void;
    }) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ body, emit: onEvent, fail: reject, finish: resolve, signal });
      })
  );

  return { calls, stream };
};

const setup = async () => {
  const queue = fakeQueue();
  const { calls, stream } = controllableStream();
  const onSettled = jest.fn();
  const onFinished = jest.fn();
  const hook = await renderHook(() =>
    useVoiceTurn({
      speechQueueDeps: queue.deps,
      onFinished,
      onSettled,
      stream: stream as never,
      threadId: 'thread-1',
    })
  );

  return { calls, hook, onFinished, onSettled, queue };
};

describe('useVoiceTurn', () => {
  it('runs a turn and reports finished only after playback drains', async () => {
    const { calls, hook, onFinished, onSettled, queue } = await setup();

    await act(async () => hook.result.current.start('weather?'));

    expect(calls[0]!.body).toMatchObject({ threadId: 'thread-1', transcript: 'weather?' });
    expect(hook.result.current.isRunning).toBe(true);

    await act(async () => {
      calls[0]!.emit({ type: 'agent_chunk', text: 'Sunny.' });
      calls[0]!.emit({ type: 'agent_end' });
      calls[0]!.emit({ type: 'speech_segment', seq: 0, text: 'Sunny.' });
      calls[0]!.emit({ type: 'speech_end' });
      calls[0]!.finish();
    });

    expect(hook.result.current.agentTranscript).toBe('Sunny.');
    expect(hook.result.current.isSpeaking).toBe(true);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onFinished).not.toHaveBeenCalled();

    await act(async () => queue.finishers[0]!());

    expect(hook.result.current.isSpeaking).toBe(false);
    expect(hook.result.current.isRunning).toBe(false);
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('speaks every segment in order, including repeated sentences', async () => {
    const { calls, hook, onFinished, queue } = await setup();

    await act(async () => hook.result.current.start('book it?'));
    await act(async () => {
      calls[0]!.emit({ type: 'speech_segment', seq: 0, text: 'OK.' });
      calls[0]!.emit({ type: 'speech_segment', seq: 1, text: 'OK.' });
      calls[0]!.emit({ type: 'speech_end' });
      calls[0]!.finish();
    });
    await act(async () => queue.finishers[0]!());
    await act(async () => queue.finishers[1]!());

    expect(queue.spoken).toEqual(['OK.', 'OK.']);
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('sends the client message id with the transcript', async () => {
    const { calls, hook } = await setup();

    await act(async () => hook.result.current.start('weather?', 'm-1'));

    expect(calls[0]!.body).toMatchObject({ messageId: 'm-1', transcript: 'weather?' });
  });

  it('holds on approval, then resumes on the same thread with the given payload', async () => {
    const { calls, hook, onFinished, queue } = await setup();

    await act(async () => hook.result.current.start('book it'));
    await act(async () => {
      calls[0]!.emit({ type: 'agent_interrupt', value: { actionRequests: [] } });
      calls[0]!.emit({ type: 'speech_segment', seq: 0, text: 'Please confirm.' });
      calls[0]!.emit({ type: 'speech_end' });
      calls[0]!.finish();
    });
    await act(async () => queue.finishers[0]!());

    expect(hook.result.current.pendingApproval).toEqual({ actionRequests: [] });
    expect(onFinished).not.toHaveBeenCalled();

    await act(async () =>
      hook.result.current.respondToApproval({ decisions: [{ type: 'approve' }] })
    );

    expect(calls[1]!.body).toEqual({
      resume: { decisions: [{ type: 'approve' }] },
      threadId: 'thread-1',
    });
    expect(hook.result.current.pendingApproval).toBeNull();
  });

  it('stop aborts the request, clears audio and never resumes a pending approval', async () => {
    const { calls, hook } = await setup();

    await act(async () => hook.result.current.start('book it'));
    await act(async () => calls[0]!.emit({ type: 'agent_interrupt', value: {} }));
    await act(async () => hook.result.current.stop());

    expect(calls[0]!.signal.aborted).toBe(true);
    expect(calls).toHaveLength(1);
    expect(hook.result.current.pendingApproval).toBeNull();
    expect(hook.result.current.isRunning).toBe(false);
  });

  it('maps agent_end errors and network failures, still settling and finishing', async () => {
    const { calls, hook, onFinished, onSettled } = await setup();

    await act(async () => hook.result.current.start('x'));
    await act(async () => {
      calls[0]!.emit({ type: 'agent_end', error: { code: 'thread_busy', message: 'busy' } });
      calls[0]!.emit({ type: 'speech_end' });
      calls[0]!.finish();
    });

    expect(hook.result.current.errorMessage).toBe(VOICE_ERROR_MESSAGES.THREAD_BUSY);
    expect(onFinished).toHaveBeenCalledTimes(1);

    await act(async () => hook.result.current.start('y'));
    await act(async () => calls[1]!.fail(new TypeError('Network request failed')));

    expect(hook.result.current.errorMessage).toBe(VOICE_ERROR_MESSAGES.CONNECTION_LOST);
    expect(onSettled).toHaveBeenCalledTimes(2);
    expect(onFinished).toHaveBeenCalledTimes(2);
  });

  it('maps a missing key to INVALID_KEY', async () => {
    const { calls, hook } = await setup();

    await act(async () => hook.result.current.start('x'));
    await act(async () =>
      calls[0]!.fail(Object.assign(new Error('x'), { code: 'missing_key', status: 400 }))
    );

    expect(hook.result.current.errorMessage).toBe(VOICE_ERROR_MESSAGES.INVALID_KEY);
  });

  it('ignores events from a request that was stopped', async () => {
    const { calls, hook, onFinished, queue } = await setup();

    await act(async () => hook.result.current.start('x'));
    await act(async () => hook.result.current.stop());
    await act(async () => {
      calls[0]!.emit({ type: 'speech_segment', seq: 0, text: 'late' });
      calls[0]!.fail(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    });

    expect(queue.finishers).toHaveLength(0);
    expect(hook.result.current.isSpeaking).toBe(false);
    expect(hook.result.current.errorMessage).toBeNull();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('stops the approval prompt clip before resuming so it cannot overlap listening', async () => {
    const { calls, hook, onFinished, queue } = await setup();

    await act(async () => hook.result.current.start('book it'));
    await act(async () => {
      calls[0]!.emit({ type: 'agent_interrupt', value: { actionRequests: [] } });
      calls[0]!.emit({ type: 'speech_segment', seq: 0, text: 'Please confirm.' });
      calls[0]!.emit({ type: 'speech_end' });
      calls[0]!.finish();
    });
    await act(async () => hook.result.current.respondToApproval({ decisions: [] }));

    expect(queue.stop).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isSpeaking).toBe(false);

    await act(async () => calls[1]!.finish());

    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
