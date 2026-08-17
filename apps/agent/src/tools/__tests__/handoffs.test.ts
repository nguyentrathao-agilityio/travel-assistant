import { describe, expect, it } from 'vitest';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';

import { transferToBookFlightTool, transferToBookHotelTool } from '@/tools/handoffs';

const runtimeConfig = (toolCallId: string, messages: unknown[] = []) =>
  ({
    toolCallId,
    configurable: {},
    state: { messages },
  }) as never;

describe('transferToBookFlightTool', () => {
  it('records a flight handoff for the parent graph router', async () => {
    const command = (await transferToBookFlightTool.invoke(
      {
        flightId: 'FL1',
        adults: 2,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+123456',
      },
      runtimeConfig('call_1')
    )) as Command;

    expect(command).toBeInstanceOf(Command);
    expect(command.update).toMatchObject({
      bookingOperation: 'flight',
      handoffTarget: 'booking',
    });
    expect(command.goto).toEqual([]);
  });

  it('restates every booking field in the handoff ToolMessage, matching the calling tool_call_id', async () => {
    const command = (await transferToBookFlightTool.invoke(
      {
        flightId: 'FL1',
        adults: 2,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+123456',
        notes: 'aisle seat',
      },
      runtimeConfig('call_1')
    )) as Command;

    const toolMessage = (command.update as { messages: unknown[] }).messages.find(
      (m): m is ToolMessage => m instanceof ToolMessage
    );

    expect(toolMessage?.tool_call_id).toBe('call_1');
    expect(toolMessage?.content).toContain('flightId=FL1');
    expect(toolMessage?.content).toContain('adults=2');
    expect(toolMessage?.content).toContain('customerName=John Doe');
    expect(toolMessage?.content).toContain('customerEmail=john@example.com');
    expect(toolMessage?.content).toContain('customerPhone=+123456');
    expect(toolMessage?.content).toContain('notes=aisle seat');
    expect(toolMessage?.content).toContain('bookFlightTool');
  });

  it('includes the calling AIMessage but not the rest of the conversation history', async () => {
    const callingMessage = new AIMessage({ content: '', tool_calls: [] });
    const olderMessage = new AIMessage({ content: 'unrelated earlier turn' });
    const command = (await transferToBookFlightTool.invoke(
      {
        flightId: 'FL1',
        adults: 1,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+123456',
      },
      runtimeConfig('call_1', [olderMessage, callingMessage])
    )) as Command;

    const messages = (command.update as { messages: unknown[] }).messages;

    expect(messages).toHaveLength(2);
    expect(messages).toContain(callingMessage);
    expect(messages).not.toContain(olderMessage);
  });
});

describe('transferToBookHotelTool', () => {
  it('records a hotel handoff for the parent graph router with every field restated', async () => {
    const command = (await transferToBookHotelTool.invoke(
      {
        hotelId: 'HTL1',
        city: 'Da Nang',
        checkIn: '2026-08-05',
        checkOut: '2026-08-07',
        rooms: 1,
        adults: 2,
        children: 0,
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+654321',
      },
      runtimeConfig('call_2')
    )) as Command;

    expect(command.update).toMatchObject({
      bookingOperation: 'hotel',
      handoffTarget: 'booking',
    });
    expect(command.goto).toEqual([]);
    const toolMessage = (command.update as { messages: unknown[] }).messages.find(
      (m): m is ToolMessage => m instanceof ToolMessage
    );

    expect(toolMessage?.tool_call_id).toBe('call_2');
    expect(toolMessage?.content).toContain('hotelId=HTL1');
    expect(toolMessage?.content).toContain('checkIn=2026-08-05');
    expect(toolMessage?.content).toContain('bookHotelTool');
  });
});
