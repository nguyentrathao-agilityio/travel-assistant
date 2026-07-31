import { toAgUiMessage } from '@/utils/langgraphMessage';

describe('toAgUiMessage legacy compatibility', () => {
  it('restores OpenAI tool calls stored in additional_kwargs', () => {
    expect(
      toAgUiMessage(
        {
          id: 'assistant-1',
          type: 'ai',
          content: '',
          additional_kwargs: {
            tool_calls: [
              {
                id: 'call-1',
                function: {
                  name: 'searchPlaces',
                  arguments: '{"city":"Da Nang"}',
                },
              },
            ],
          },
        },
        'fallback'
      )
    ).toEqual({
      id: 'assistant-1',
      role: 'assistant',
      toolCalls: [
        {
          id: 'call-1',
          type: 'function',
          function: {
            name: 'placesTool',
            arguments: '{"city":"Da Nang"}',
          },
        },
      ],
    });
  });

  it('keeps persisted JSON tool results serialized for the AG-UI transport', () => {
    expect(
      toAgUiMessage(
        {
          id: 'tool-1',
          type: 'tool',
          tool_call_id: 'call-1',
          content: '{"total":1,"places":[{"id":"place-1"}]}',
        },
        'fallback'
      )
    ).toEqual({
      id: 'tool-1',
      role: 'tool',
      toolCallId: 'call-1',
      content: '{"total":1,"places":[{"id":"place-1"}]}',
    });
  });

  it('uses a persisted tool artifact as the rich-card result', () => {
    expect(
      toAgUiMessage(
        {
          id: 'tool-1',
          type: 'tool',
          tool_call_id: 'call-1',
          content: 'The result is ready.',
          artifact: { total: 1, places: [{ id: 'place-1' }] },
        },
        'fallback'
      )
    ).toEqual({
      id: 'tool-1',
      role: 'tool',
      toolCallId: 'call-1',
      content: '{"total":1,"places":[{"id":"place-1"}]}',
    });
  });

  it('keeps non-JSON tool results as text', () => {
    expect(
      toAgUiMessage(
        {
          id: 'tool-1',
          type: 'tool',
          tool_call_id: 'call-1',
          content: 'Booking unavailable',
        },
        'fallback'
      )
    ).toMatchObject({ content: 'Booking unavailable' });
  });
});
