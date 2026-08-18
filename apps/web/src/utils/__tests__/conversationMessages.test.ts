import type { MessagesProps } from '@copilotkit/react-ui';

import { reconcileConversationMessages } from '@/utils/conversationMessages';

type ChatMessage = MessagesProps['messages'][number];

describe('reconcileConversationMessages', () => {
  it('keeps a completed tool result when an active snapshot regresses to pending', () => {
    const previousMessages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'Find places in Da Nang' },
      {
        id: 'a1',
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            id: 'call-places',
            type: 'function',
            function: { name: 'placesTool', arguments: '{"city":"Da Nang"}' },
          },
        ],
      },
      {
        id: 't1',
        role: 'tool',
        toolCallId: 'call-places',
        content: '{"total":8}',
      },
    ];
    const pendingSnapshot = previousMessages.slice(0, 2);

    const result = reconcileConversationMessages(pendingSnapshot, {
      previousMessages,
      inProgress: true,
    });

    expect(result).toEqual(previousMessages);
  });

  it('keeps a completed tool result when the run ends before the snapshot catches up', () => {
    const previousMessages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'Find places in Da Nang' },
      {
        id: 'a1',
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            id: 'call-places',
            type: 'function',
            function: { name: 'placesTool', arguments: '{"city":"Da Nang"}' },
          },
        ],
      },
      {
        id: 't1',
        role: 'tool',
        toolCallId: 'call-places',
        content: '{"total":8}',
      },
    ];
    const staleSnapshot = previousMessages.slice(0, 2);

    const result = reconcileConversationMessages(staleSnapshot, {
      previousMessages,
      inProgress: false,
    });

    expect(result).toEqual(previousMessages);
  });
});
