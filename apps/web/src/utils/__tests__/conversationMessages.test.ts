import type { MessagesProps } from '@copilotkit/react-ui';

import {
  type ConversationChatMessage,
  reconcileConversationMessages,
} from '@/utils/conversationMessages';

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

  it('keeps a resolved card and its result when an active snapshot drops both', () => {
    const userMessage: ConversationChatMessage = {
      id: 'u1',
      role: 'user',
      content: 'Show places in Da Nang',
    };
    const cardCall: ConversationChatMessage = {
      id: 'a-card',
      role: 'assistant',
      content: '',
      hasResolvedToolCard: true,
      toolCalls: [
        {
          id: 'call-places',
          type: 'function',
          function: { name: 'placesTool', arguments: '{"city":"Da Nang"}' },
        },
      ],
    };
    const cardResult: ConversationChatMessage = {
      id: 't-card',
      role: 'tool',
      toolCallId: 'call-places',
      content: '{"total":8}',
    };
    const response: ConversationChatMessage = {
      id: 'a-response',
      role: 'assistant',
      content: 'Here are the top places in Da Nang.',
    };
    const previousMessages = [userMessage, cardCall, cardResult, response];
    const regressedSnapshot = [userMessage, response];

    const result = reconcileConversationMessages(regressedSnapshot, {
      previousMessages,
      inProgress: true,
    });

    expect(result.map(({ id }) => id)).toEqual(['u1', 'a-card', 't-card', 'a-response']);
  });

  it.each([true, false])(
    'keeps a resolved booking card before the agent confirmation when inProgress=%s',
    (inProgress) => {
      const bookingCall: ConversationChatMessage = {
        id: 'a-booking',
        role: 'assistant',
        content: '',
        hasResolvedToolCard: true,
        toolCalls: [
          {
            id: 'call-booking',
            type: 'function',
            function: { name: 'bookFlight', arguments: '{"flightId":"VN123"}' },
          },
        ],
      };
      const bookingResult: ConversationChatMessage = {
        id: 't-booking',
        role: 'tool',
        toolCallId: 'call-booking',
        content: '{"status":"confirmed"}',
      };
      const confirmation: ConversationChatMessage = {
        id: 'a-confirmation',
        role: 'assistant',
        content: 'Your flight booking has been confirmed.',
      };
      const userMessage: ConversationChatMessage = {
        id: 'u1',
        role: 'user',
        content: 'Confirm my booking',
      };
      const previousMessages = [userMessage, bookingCall, bookingResult, confirmation];
      const reorderedSnapshot = [userMessage, confirmation, bookingCall, bookingResult];

      const result = reconcileConversationMessages(reorderedSnapshot, {
        previousMessages,
        inProgress,
      });

      expect(result.map(({ id }) => id)).toEqual([
        'u1',
        'a-booking',
        't-booking',
        'a-confirmation',
      ]);
    }
  );
});
