import { describe, expect, it } from 'vitest';

import type { GraphStateType } from '../../state';
import { buildSystemPrompt } from '../build-system-prompt';

describe('buildSystemPrompt booking selection', () => {
  it('exposes the confirmed hotel to the next agent turn without claiming it is booked', () => {
    const state = {
      hotelSelectionStatus: 'confirmed',
      hotel: {
        id: 'h1',
        shortCode: 'OCEAN',
        code: 'OCEAN-DAD',
        name: 'Ocean View Hotel',
        city: 'Da Nang',
        country: 'Vietnam',
        address: '1 Beach Road',
        starRating: 4,
        pricePerNight: 100,
        currency: 'USD',
        amenities: ['wifi'],
        rating: 4.5,
        reviewCount: 100,
        imageUrl: 'https://example.com/hotel.jpg',
        available: true,
        availableRooms: 5,
        maxOccupancyPerRoom: 2,
        nights: 3,
        totalPrice: 300,
      },
      clientDate: '2026-07-23',
      clientTimezone: 'Asia/Ho_Chi_Minh',
    } as unknown as GraphStateType;

    const prompt = buildSystemPrompt(state);

    expect(prompt).toContain('hotelSelectionStatus: confirmed');
    expect(prompt).toContain('name: Ocean View Hotel');
    expect(prompt).toContain('city: Da Nang');
    expect(prompt).toContain('totalPrice: 300');
    expect(prompt).toContain('currency: USD');
    expect(prompt).toContain('does NOT mean an external booking or payment completed');
    expect(prompt).toContain('call the frontend action "show-booked-hotel"');
  });
});
