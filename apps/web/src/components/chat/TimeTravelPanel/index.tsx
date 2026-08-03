import { GitBranch, History, Loader2, Play, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/common';
import { ERROR_MESSAGES } from '@/constants';
import { langgraphClient } from '@/lib';
import { useThreadStore } from '@/stores';
import { cn, langgraphMessageText } from '@/utils';

import type { ThreadState } from '@langchain/langgraph-sdk';
import type { LangGraphRawMessage, LangGraphThreadValues } from '@/utils';

const HISTORY_LIMIT = 50;
const GRAPH_ID = 'travel';

const messageLabel = (message: LangGraphRawMessage | undefined): string => {
  if (!message) return 'Workflow initialized';
  const role = message.role ?? message.type ?? 'message';
  const text = langgraphMessageText(message.content).trim();
  if (text) return `${role}: ${text}`;
  const tool = message.tool_calls?.[0]?.name ?? message.additional_kwargs?.tool_calls?.[0]?.name;
  return tool ? `assistant called ${tool}` : role;
};

const checkpointLabel = (state: ThreadState<LangGraphThreadValues>): string => {
  const messages = state.values?.messages ?? [];
  return messageLabel(messages.at(-1));
};

const writeNodes = (state: ThreadState<LangGraphThreadValues>): string[] => {
  const writes = state.metadata?.writes;
  return writes && typeof writes === 'object' ? Object.keys(writes) : [];
};

interface TimeTravelPanelProps {
  open: boolean;
  onClose: () => void;
}

export const TimeTravelPanel = ({ open, onClose }: TimeTravelPanelProps) => {
  const threadId = useThreadStore((state) => state.activeThreadId);
  const refreshActiveThread = useThreadStore((state) => state.refreshActiveThread);
  const [history, setHistory] = useState<ThreadState<LangGraphThreadValues>[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [alternative, setAlternative] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!threadId) return;
    setIsLoading(true);
    try {
      const states = await langgraphClient.threads.getHistory<LangGraphThreadValues>(threadId, {
        limit: HISTORY_LIMIT,
      });
      setHistory(states);
      setSelectedId((current) =>
        current && states.some((state) => state.checkpoint.checkpoint_id === current)
          ? current
          : (states[0]?.checkpoint.checkpoint_id ?? null)
      );
    } catch {
      toast.error(ERROR_MESSAGES.LOAD_WORKFLOW_HISTORY);
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (open) void loadHistory();
  }, [open, loadHistory]);

  const selected = useMemo(
    () => history.find((state) => state.checkpoint.checkpoint_id === selectedId),
    [history, selectedId]
  );

  const runFromCheckpoint = async (input: Record<string, unknown> | null) => {
    if (!selectedId) return;
    setIsRunning(true);
    try {
      await langgraphClient.runs.wait(threadId, GRAPH_ID, {
        checkpointId: selectedId,
        input,
        multitaskStrategy: 'reject',
      });
      refreshActiveThread();
      await loadHistory();
      setAlternative('');
      onClose();
      toast.success(input ? 'Alternative itinerary branch created.' : 'Workflow replayed.');
    } catch {
      toast.error(ERROR_MESSAGES.TIME_TRAVEL);
    } finally {
      setIsRunning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="bg-background-primary absolute right-4 top-16 z-[70] flex max-h-[calc(100vh-5rem)] w-[min(48rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border shadow-xl">
      <div className="flex items-start justify-between border-b p-4">
        <div>
          <div className="flex items-center gap-2">
            <History size={18} />
            <h2 className="font-semibold">Workflow history</h2>
          </div>
          <p className="text-text-secondary mt-1 text-sm">
            Inspect, replay, or fork an earlier checkpoint. Existing branches are preserved.
          </p>
        </div>
        <Button variant="ghost" size="sm" aria-label="Close workflow history" onClick={onClose}>
          <X size={17} />
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
        <div className="scrollbar-thin min-h-52 overflow-y-auto border-b p-3 md:border-b-0 md:border-r">
          {isLoading ? (
            <div className="text-text-secondary flex items-center justify-center gap-2 py-12">
              <Loader2 size={17} className="animate-spin" /> Loading checkpoints…
            </div>
          ) : history.length === 0 ? (
            <p className="text-text-secondary p-4 text-center text-sm">No checkpoints yet.</p>
          ) : (
            <ol className="space-y-2">
              {history.map((state, index) => {
                const id = state.checkpoint.checkpoint_id;
                const nodes = writeNodes(state);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(id ?? null)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors',
                        id === selectedId
                          ? 'border-brand-500 bg-sidebar-item-active'
                          : 'hover:bg-sidebar-item-active'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">Checkpoint {history.length - index}</span>
                        <time className="text-text-secondary">
                          {state.created_at
                            ? new Date(state.created_at).toLocaleString()
                            : 'Unknown time'}
                        </time>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm">{checkpointLabel(state)}</p>
                      <p className="text-text-secondary mt-1 text-xs">
                        {nodes.length ? `Writes: ${nodes.join(', ')}` : 'Initial state'}
                        {state.next.length ? ` · Next: ${state.next.join(', ')}` : ''}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {selected ? (
            <>
              <div>
                <p className="text-label text-text-secondary uppercase tracking-wide">Snapshot</p>
                <p className="mt-1 text-sm">{checkpointLabel(selected)}</p>
                <dl className="text-text-secondary mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt>Step</dt>
                  <dd>{String(selected.metadata?.step ?? '—')}</dd>
                  <dt>Next</dt>
                  <dd>{selected.next.join(', ') || 'Waiting for input'}</dd>
                  <dt>Messages</dt>
                  <dd>{selected.values?.messages?.length ?? 0}</dd>
                  <dt>Checkpoint</dt>
                  <dd className="truncate" title={selectedId ?? ''}>
                    {selectedId}
                  </dd>
                </dl>
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  disabled={isRunning || selected.next.length === 0}
                  onClick={() => void runFromCheckpoint(null)}
                >
                  {isRunning ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  Replay execution
                </Button>
                <p className="text-text-secondary mt-1 text-xs">
                  {selected.next.length
                    ? 'Re-runs the workflow from the next node after this snapshot.'
                    : 'This snapshot is complete. Select an earlier checkpoint to replay it.'}
                </p>
              </div>

              <div className="border-t pt-4">
                <label
                  htmlFor="alternative-branch"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <GitBranch size={16} /> Explore an alternative
                </label>
                <textarea
                  id="alternative-branch"
                  value={alternative}
                  onChange={(event) => setAlternative(event.target.value)}
                  placeholder="e.g. Make it a budget-friendly 3-day itinerary instead"
                  className="border-sidebar-border mt-2 min-h-24 w-full resize-y rounded-lg border bg-transparent p-3 text-sm outline-none focus:border-blue-500"
                />
                <Button
                  variant="brand"
                  className="mt-2 w-full gap-2"
                  disabled={isRunning || !alternative.trim()}
                  onClick={() =>
                    void runFromCheckpoint({
                      messages: [{ type: 'human', content: alternative.trim() }],
                    })
                  }
                >
                  {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Create alternative branch
                </Button>
              </div>
            </>
          ) : (
            <p className="text-text-secondary text-sm">Select a checkpoint to inspect it.</p>
          )}
        </div>
      </div>
    </div>
  );
};
