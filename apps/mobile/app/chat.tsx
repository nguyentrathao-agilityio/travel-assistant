import { useLocalSearchParams } from 'expo-router';

import { ChatPlaceholderScreen } from '../src/components';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string; focusVoice?: string }>();

  return (
    <ChatPlaceholderScreen threadId={params.threadId} focusVoice={params.focusVoice === '1'} />
  );
}
