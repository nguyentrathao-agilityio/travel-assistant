import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useVoiceAudioList } from '../useVoiceAudioList';

const mockFetchVoiceAudioList = jest.fn();

jest.mock('../../services/voiceAudio', () => ({
  fetchVoiceAudioList: (...args: unknown[]) => mockFetchVoiceAudioList(...args),
}));

const renderList = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderHook(() => useVoiceAudioList('t1'), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

test('maps recorded message ids to their durations', async () => {
  mockFetchVoiceAudioList.mockResolvedValue([{ durationMs: 900, messageId: 'm1' }]);

  const { result } = await renderList();

  await waitFor(() => expect([...result.current]).toEqual([['m1', 900]]));
  expect(mockFetchVoiceAudioList).toHaveBeenCalledWith('t1');
});

test('hides recording playback when the list request fails', async () => {
  mockFetchVoiceAudioList.mockRejectedValue(new Error('voice_audio_unavailable'));

  const { result } = await renderList();

  await waitFor(() => expect(mockFetchVoiceAudioList).toHaveBeenCalled());
  expect(result.current.size).toBe(0);
});
