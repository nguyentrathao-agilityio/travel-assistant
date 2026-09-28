import { TOOL_NAMES } from '@repo/constants';

import type { HotelSearchResult, TranscriptMessage } from '@repo/schemas';

const TOOL_TURN_INTERVAL = 5;
const TOOL_GROUP_SIZE = 4;
const PLAIN_TURN_SIZE = 2;
const HOTELS_PER_RESULT = 3;

const hotelResult = (turn: number): HotelSearchResult => ({
  total: HOTELS_PER_RESULT,
  limit: HOTELS_PER_RESULT,
  offset: 0,
  search: { city: 'Da Nang', checkIn: '2026-10-01', checkOut: '2026-10-03', nights: 2, rooms: 1 },
  results: Array.from({ length: HOTELS_PER_RESULT }, (_, index) => {
    const id = `stress-hotel-${turn}-${index}`;

    return {
      id,
      shortCode: `SH${turn}${index}`,
      code: `STRESS-${turn}-${index}`,
      name: `Stress Hotel ${turn}-${index}`,
      city: 'Da Nang',
      country: 'Vietnam',
      address: `${index + 1} Beach Road`,
      starRating: 3 + (index % 3),
      pricePerNight: 40 + index * 25,
      currency: 'USD',
      amenities: ['wifi', 'breakfast'],
      rating: 4 + index / 10,
      reviewCount: 100 + index,
      imageUrl: `https://picsum.photos/seed/${id}/640/400`,
      available: true,
      availableRooms: 5,
      maxOccupancyPerRoom: 2,
      nights: 2,
      totalPrice: (40 + index * 25) * 2,
    };
  }),
});

const toolGroup = (turn: number): TranscriptMessage[] => {
  const callId = `stress-call-${turn}`;

  return [
    { id: `stress-user-${turn}`, role: 'user', content: `Find hotels in Da Nang (${turn})` },
    {
      id: `stress-call-msg-${turn}`,
      role: 'assistant',
      content: '',
      toolCalls: [
        { id: callId, name: TOOL_NAMES.HOTEL, args: { city: 'Da Nang' }, type: 'tool_call' },
      ],
    },
    {
      id: `stress-tool-${turn}`,
      role: 'tool',
      content: JSON.stringify(hotelResult(turn)),
      toolCallId: callId,
    },
    { id: `stress-answer-${turn}`, role: 'assistant', content: `Here are 3 hotels (${turn}).` },
  ];
};

const plainTurn = (turn: number): TranscriptMessage[] => [
  { id: `stress-user-${turn}`, role: 'user', content: `Question ${turn} about the trip` },
  { id: `stress-answer-${turn}`, role: 'assistant', content: `Answer ${turn} with some detail.` },
];

/**
 * Builds a valid chat history of exactly `count` messages for stress tests: plain question/answer
 * turns with a hotel tool group (call, result with images, answer) every fifth turn. Tool results
 * always follow their call directly, so the history stays valid for the model.
 */
export const buildStressTranscript = (count: number): TranscriptMessage[] => {
  const messages: TranscriptMessage[] = [];

  for (let turn = 0; messages.length < count; turn += 1) {
    const remaining = count - messages.length;

    if (turn % TOOL_TURN_INTERVAL === 0 && remaining >= TOOL_GROUP_SIZE) {
      messages.push(...toolGroup(turn));
    } else if (remaining >= PLAIN_TURN_SIZE) {
      messages.push(...plainTurn(turn));
    } else {
      messages.push(plainTurn(turn)[0]!);
    }
  }

  return messages;
};
