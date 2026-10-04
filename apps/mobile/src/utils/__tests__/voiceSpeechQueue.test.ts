import * as Speech from 'expo-speech';

import { createVoiceSpeechQueue, defaultVoiceSpeechQueueDeps } from '../voiceSpeechQueue';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

const fakeSpeech = () => {
  const spoken: Array<{ text: string; done: () => void; fail: (error: unknown) => void }> = [];
  const stop = jest.fn();

  return {
    spoken,
    stop,
    deps: {
      speak: (
        text: string,
        callbacks: { onDone: () => void; onError: (error: unknown) => void }
      ) => {
        spoken.push({ done: callbacks.onDone, fail: callbacks.onError, text });
      },
      stop,
    },
  };
};

describe('createVoiceSpeechQueue', () => {
  it('speaks sentences one at a time in order', () => {
    const { deps, spoken } = fakeSpeech();
    const queue = createVoiceSpeechQueue(deps, jest.fn());

    queue.enqueue('Sunny  today.');
    queue.enqueue('Pack light.');

    expect(spoken.map(({ text }) => text)).toEqual(['Sunny today.']);
    expect(queue.isPlaying).toBe(true);

    spoken[0]!.done();

    expect(spoken.map(({ text }) => text)).toEqual(['Sunny today.', 'Pack light.']);
  });

  it('reports idle once a finished batch drains', () => {
    const { deps, spoken } = fakeSpeech();
    const onIdle = jest.fn();
    const queue = createVoiceSpeechQueue(deps, onIdle);

    queue.enqueue('One.');
    queue.enqueue('Two.');
    queue.markBatchEnd();
    spoken[0]!.done();

    expect(onIdle).not.toHaveBeenCalled();

    spoken[1]!.done();

    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(queue.isPlaying).toBe(false);
  });

  it('reports idle immediately when a batch ends with nothing queued', () => {
    const onIdle = jest.fn();

    createVoiceSpeechQueue(fakeSpeech().deps, onIdle).markBatchEnd();

    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('ignores blank sentences', () => {
    const { deps, spoken } = fakeSpeech();

    createVoiceSpeechQueue(deps, jest.fn()).enqueue('  \n ');

    expect(spoken).toHaveLength(0);
  });

  it('clear stops speech, drops pending sentences and ignores late callbacks', () => {
    const { deps, spoken, stop } = fakeSpeech();
    const onIdle = jest.fn();
    const queue = createVoiceSpeechQueue(deps, onIdle);

    queue.enqueue('One.');
    queue.enqueue('Two.');
    queue.clear();
    spoken[0]!.done();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(spoken).toHaveLength(1);
    expect(queue.isPlaying).toBe(false);

    queue.markBatchEnd();

    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('moves on to the next sentence when speaking fails', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { deps, spoken } = fakeSpeech();
    const onIdle = jest.fn();
    const queue = createVoiceSpeechQueue(deps, onIdle);

    queue.enqueue('One.');
    queue.enqueue('Two.');
    queue.markBatchEnd();
    spoken[0]!.fail(new Error('tts unavailable'));
    spoken[1]!.done();

    expect(onIdle).toHaveBeenCalledTimes(1);
  });
});

describe('defaultVoiceSpeechQueueDeps', () => {
  it('speaks with the locale matching the sentence language', () => {
    const callbacks = { onDone: jest.fn(), onError: jest.fn() };

    defaultVoiceSpeechQueueDeps.speak('Xin chào Đà Nẵng.', callbacks);
    defaultVoiceSpeechQueueDeps.speak('Hello there.', callbacks);

    expect(Speech.speak).toHaveBeenNthCalledWith(1, 'Xin chào Đà Nẵng.', {
      language: 'vi-VN',
      ...callbacks,
    });
    expect(Speech.speak).toHaveBeenNthCalledWith(2, 'Hello there.', {
      language: 'en-US',
      ...callbacks,
    });
  });
});
