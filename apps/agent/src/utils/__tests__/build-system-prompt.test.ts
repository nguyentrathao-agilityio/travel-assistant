import { describe, expect, it } from 'vitest';

import type { GraphStateType } from '../../state';
import { buildBranchSystemPrompt } from '../build-system-prompt';

const baseState = {
  clientDate: '2026-07-23',
  clientTimezone: 'Asia/Ho_Chi_Minh',
} as unknown as GraphStateType;

describe('buildBranchSystemPrompt', () => {
  it('omits booking rules and booking context when not requested', () => {
    const prompt = buildBranchSystemPrompt(baseState, {
      toolsSection: '## Available Tools\n- placesTool',
    });

    expect(prompt).toContain('placesTool');
    expect(prompt).not.toContain('does NOT mean an external booking or payment completed');
    expect(prompt).not.toContain('Current Booking State');
  });

  it('includes booking rules and the confirmed selection when requested', () => {
    const state = {
      ...baseState,
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
    } as unknown as GraphStateType;

    const prompt = buildBranchSystemPrompt(state, {
      toolsSection: '## Available Tools\n- bookHotelTool',
      includeBookingRules: true,
      includeBookingContext: true,
    });

    expect(prompt).toContain('does NOT mean an external booking or payment completed');
    expect(prompt).toContain('call the frontend action "show-booked-hotel"');
    expect(prompt).toContain('hotelSelectionStatus: confirmed');
    expect(prompt).toContain('name: Ocean View Hotel');
  });

  it('always includes client date and timezone', () => {
    const prompt = buildBranchSystemPrompt(baseState, {
      toolsSection: '## Available Tools\n- weatherTool',
    });

    expect(prompt).toContain('today: 2026-07-23');
    expect(prompt).toContain('timezone: Asia/Ho_Chi_Minh');
  });

  it('omits the remembered preferences section when not requested, even if memories are passed', () => {
    const prompt = buildBranchSystemPrompt(
      baseState,
      { toolsSection: '## Available Tools\n- weatherTool' },
      ['Departure city: Da Nang']
    );

    expect(prompt).not.toContain('Remembered Preferences');
  });

  it('omits the remembered preferences section when requested but none are passed', () => {
    const prompt = buildBranchSystemPrompt(baseState, {
      toolsSection: '## Available Tools\n- flightsTool',
      includeMemoryContext: true,
    });

    expect(prompt).not.toContain('Remembered Preferences');
  });

  it('includes remembered preferences when requested and present', () => {
    const prompt = buildBranchSystemPrompt(
      baseState,
      { toolsSection: '## Available Tools\n- flightsTool', includeMemoryContext: true },
      ['Departure city: Da Nang']
    );

    expect(prompt).toContain('Remembered Preferences');
    expect(prompt).toContain('- Departure city: Da Nang');
  });
});
