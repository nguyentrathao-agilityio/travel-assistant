import { act, renderHook } from '@testing-library/react-native';

import { useMessagePlayback } from '../useMessagePlayback';

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn() }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('../../services/voiceAudio', () => ({ fetchVoiceAudioPlaybackUrl: jest.fn() }));

const makeDeps = () => {
  const players: Array<{ finish: () => void; play: jest.Mock; remove: jest.Mock }> = [];
  const speechDone: Array<() => void> = [];

  return {
    players,
    speechDone,
    deps: {
      createPlayer: jest.fn(() => {
        const player: { finish: () => void; play: jest.Mock; remove: jest.Mock } = {
          finish: () => undefined,
          play: jest.fn(),
          remove: jest.fn(),
        };
        players.push(player);

        return {
          onFinish: (listener: () => void) => {
            player.finish = listener;
          },
          play: player.play,
          remove: player.remove,
        };
      }),
      playbackUrl: jest.fn().mockResolvedValue('https://bucket.example/get'),
      speak: jest.fn((_text: string, onDone: () => void) => speechDone.push(onDone)),
      stopSpeech: jest.fn(),
    },
  };
};

describe('useMessagePlayback', () => {
  it('plays a recording from a fresh playback URL and clears when it finishes', async () => {
    const { deps, players } = makeDeps();
    const { result } = await renderHook(() => useMessagePlayback({ deps, threadId: 't1' }));

    await act(async () => result.current.playRecording('m1'));

    expect(deps.playbackUrl).toHaveBeenCalledWith('t1', 'm1');
    expect(deps.createPlayer).toHaveBeenCalledWith('https://bucket.example/get');
    expect(players[0]!.play).toHaveBeenCalled();
    expect(result.current.playingId).toBe('m1');
    expect(result.current.loadingId).toBeNull();

    await act(async () => players[0]!.finish());

    expect(result.current.playingId).toBeNull();
    expect(players[0]!.remove).toHaveBeenCalled();
  });

  it('stops the current playback when another starts', async () => {
    const { deps, players } = makeDeps();
    const { result } = await renderHook(() => useMessagePlayback({ deps, threadId: 't1' }));

    await act(async () => result.current.playRecording('m1'));
    await act(async () => result.current.speakReply('a1', 'Sunny tomorrow.'));

    expect(players[0]!.remove).toHaveBeenCalled();
    expect(deps.speak).toHaveBeenCalledWith('Sunny tomorrow.', expect.any(Function));
    expect(result.current.playingId).toBe('a1');
  });

  it('toggles off when the playing message is pressed again', async () => {
    const { deps } = makeDeps();
    const { result } = await renderHook(() => useMessagePlayback({ deps, threadId: 't1' }));

    await act(async () => result.current.speakReply('a1', 'Hi.'));
    await act(async () => result.current.speakReply('a1', 'Hi.'));

    expect(deps.stopSpeech).toHaveBeenCalled();
    expect(result.current.playingId).toBeNull();
  });

  it('ignores a playback URL that arrives after the user moved on', async () => {
    const { deps } = makeDeps();
    let resolveUrl: (url: string) => void = () => undefined;
    deps.playbackUrl.mockReturnValueOnce(new Promise((resolve) => (resolveUrl = resolve)));
    const { result } = await renderHook(() => useMessagePlayback({ deps, threadId: 't1' }));

    await act(async () => result.current.playRecording('m1'));

    expect(result.current.loadingId).toBe('m1');

    await act(async () => result.current.stop());
    await act(async () => resolveUrl('https://late'));

    expect(deps.createPlayer).not.toHaveBeenCalled();
    expect(result.current.loadingId).toBeNull();
  });

  it('stops everything on unmount', async () => {
    const { deps, players } = makeDeps();
    const hook = await renderHook(() => useMessagePlayback({ deps, threadId: 't1' }));

    await act(async () => hook.result.current.playRecording('m1'));
    await act(async () => hook.unmount());

    expect(players[0]!.remove).toHaveBeenCalled();
  });
});
