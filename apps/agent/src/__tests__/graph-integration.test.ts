import { HumanMessage } from '@langchain/core/messages';
import { Command, END, MemorySaver, START, StateGraph, interrupt } from '@langchain/langgraph';
import { describe, expect, it, vi } from 'vitest';

import { GraphState, normalizeGraphState, type GraphStateType } from '@/state';

const config = (threadId: string) => ({ configurable: { thread_id: threadId } });

const buildPersistenceGraph = () =>
  new StateGraph(GraphState)
    .addNode('extract', (state: GraphStateType) => {
      const latest = state.messages.at(-1)?.content;
      const text = typeof latest === 'string' ? latest : '';

      if (text.includes('Da Nang')) return { request: { destination: 'Da Nang' } };
      if (text.includes('second')) return { selectedOptions: { hotelId: 'hotel-2' } };

      return {};
    })
    .addEdge(START, 'extract')
    .addEdge('extract', END)
    .compile({ checkpointer: new MemorySaver() });

describe('checkpointed graph integration', () => {
  it('restores follow-up state in the same thread and resolves a stable selected option', async () => {
    const graph = buildPersistenceGraph();
    const thread = config('thread-a');

    await graph.invoke({ messages: [new HumanMessage('Find hotels in Da Nang.')] }, thread);
    await graph.invoke({ messages: [new HumanMessage('Book the second one.')] }, thread);

    const snapshot = await graph.getState(thread);

    expect(snapshot.values.request).toMatchObject({ destination: 'Da Nang' });
    expect(snapshot.values.selectedOptions).toMatchObject({ hotelId: 'hotel-2' });
    expect(snapshot.values.messages).toHaveLength(2);
  });

  it('isolates state belonging to different thread IDs', async () => {
    const graph = buildPersistenceGraph();

    await graph.invoke(
      { messages: [new HumanMessage('Find hotels in Da Nang.')] },
      config('thread-da-nang')
    );
    await graph.invoke(
      { messages: [new HumanMessage('Tell me about Kyoto.')] },
      config('thread-kyoto')
    );

    expect((await graph.getState(config('thread-da-nang'))).values.request).toMatchObject({
      destination: 'Da Nang',
    });
    expect((await graph.getState(config('thread-kyoto'))).values.request).toEqual({});
  });

  it('normalizes and serializes a legacy checkpoint-shaped state', () => {
    const normalized = normalizeGraphState({
      destination: 'Da Nang',
      startDate: '2026-09-01',
      travelers: 2,
    });

    expect(normalized.request).toEqual({
      destination: 'Da Nang',
      departureDate: '2026-09-01',
      travelers: 2,
    });
    expect(() => JSON.parse(JSON.stringify(normalized))).not.toThrow();
  });
});

describe('compiled HITL graph integration', () => {
  it('persists an interrupt and resumes it once on the same thread', async () => {
    const write = vi.fn();
    const graph = new StateGraph(GraphState)
      .addNode('approve', () => {
        const decision = interrupt({
          type: 'booking_confirmation',
          action: 'confirm_hotel',
          draftId: 'draft-1',
        }) as { decision: string };

        if (decision.decision === 'approve') write('draft-1');

        return { execution: { completedTasks: ['approval'] } };
      })
      .addEdge(START, 'approve')
      .addEdge('approve', END)
      .compile({ checkpointer: new MemorySaver() });
    const thread = config('approval-thread');

    const paused = (await graph.invoke(
      { messages: [new HumanMessage('Book it')] },
      thread
    )) as unknown as { __interrupt__: Array<{ value: unknown }> };

    expect(paused.__interrupt__).toHaveLength(1);
    expect(paused.__interrupt__[0].value).toMatchObject({ draftId: 'draft-1' });
    expect(write).not.toHaveBeenCalled();

    await graph.invoke(new Command({ resume: { decision: 'approve' } }), thread);
    expect(write).toHaveBeenCalledTimes(1);
    expect((await graph.getState(thread)).values.execution.completedTasks).toContain('approval');
  });

  it('does not execute the write when a resumed approval is rejected', async () => {
    const write = vi.fn();
    const graph = new StateGraph(GraphState)
      .addNode('approve', () => {
        const decision = interrupt({ draftId: 'draft-2' }) as { decision: string };

        if (decision.decision === 'approve') write();

        return { execution: { completedTasks: ['approval'] } };
      })
      .addEdge(START, 'approve')
      .addEdge('approve', END)
      .compile({ checkpointer: new MemorySaver() });
    const thread = config('reject-thread');

    await graph.invoke({ messages: [new HumanMessage('Book it')] }, thread);
    await graph.invoke(new Command({ resume: { decision: 'reject' } }), thread);

    expect(write).not.toHaveBeenCalled();
  });
});
