import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Services
import { fetchTranscriptPage, isTransientTranscriptError } from '../services';

// Utils
import { toAgUiMessage } from '../utils/langgraphMessage';
import { reconcileMessages } from '../utils/reconcileMessages';
import { withoutSummaryMessages } from '../utils/summaryMessage';

// Hooks
import { threadQueryKeys } from './threadQueryKeys';

// Types
import type { Message } from '@copilotkit/react-native/headless';
import type { TranscriptMessage, TranscriptPage } from '@repo/schemas';
import type { LangGraphRawMessage } from '../utils/langgraphMessage';

const MAX_TRANSCRIPT_PAGES = 3;
const MAX_TRANSCRIPT_RETRIES = 2;
const TRANSCRIPT_GC_TIME_MS = 60_000;
const OLDER_HISTORY_ERROR = 'Could not load older messages.';

// Carries the cursors of every newer page so a page evicted by `maxPages` can be fetched again.
interface TranscriptPageParam {
  cursor: string | null;
  newerCursors: (string | null)[];
}

const NEWEST_PAGE_PARAM: TranscriptPageParam = { cursor: null, newerCursors: [] };

export const shouldRetryTranscript = (failureCount: number, error: unknown): boolean =>
  isTransientTranscriptError(error) && failureCount < MAX_TRANSCRIPT_RETRIES;

const toChatMessage = (message: TranscriptMessage): Message | null =>
  toAgUiMessage(
    {
      id: message.id,
      role: message.role,
      content: message.content,
      tool_calls: message.toolCalls as LangGraphRawMessage['tool_calls'],
      tool_call_id: message.toolCallId,
    },
    message.id
  );

const toChatMessages = (pages: TranscriptPage[]): Message[] =>
  pages.flatMap((page) =>
    page.messages.flatMap((message) => {
      const converted = toChatMessage(message);

      return converted ? [converted] : [];
    })
  );

/**
 * Loads the server-side transcript for a thread as a bounded window of at most three pages,
 * newest first, and overlays the live CopilotKit messages on top by stable message ID.
 * When a run finishes the resident pages are refetched, and messages that the end-of-run
 * snapshot compacted out of the live list stay visible until the refreshed archive has them.
 */
export const useTranscriptHistory = (
  threadId: string,
  liveMessages: Message[],
  isRunning: boolean
) => {
  const query = useInfiniteQuery({
    enabled: Boolean(threadId),
    gcTime: TRANSCRIPT_GC_TIME_MS,
    getNextPageParam: (_lastPage: TranscriptPage, _pages, lastPageParam: TranscriptPageParam) => {
      const [cursor, ...newerCursors] = lastPageParam.newerCursors;

      return lastPageParam.newerCursors.length > 0
        ? { cursor: cursor ?? null, newerCursors }
        : undefined;
    },
    getPreviousPageParam: (
      firstPage: TranscriptPage,
      _pages,
      firstPageParam: TranscriptPageParam
    ) =>
      firstPage.previousCursor
        ? {
            cursor: firstPage.previousCursor,
            newerCursors: [firstPageParam.cursor, ...firstPageParam.newerCursors],
          }
        : undefined,
    initialPageParam: NEWEST_PAGE_PARAM,
    maxPages: MAX_TRANSCRIPT_PAGES,
    queryFn: ({ pageParam }) => fetchTranscriptPage(threadId, pageParam.cursor),
    queryKey: threadQueryKeys.transcript(threadId),
    retry: shouldRetryTranscript,
  });

  const { dataUpdatedAt, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage, refetch } =
    query;
  const wasRunningRef = useRef(isRunning);
  const previousLiveRef = useRef(liveMessages);
  const [retained, setRetained] = useState<Message[]>([]);

  // Only a run's end-of-run snapshot compacts live messages; clears outside a run (e.g. the shared
  // agent dropping the previous thread's messages) must not be retained.
  useEffect(() => {
    const currentIds = new Set(liveMessages.map((message) => message.id));
    const departed = previousLiveRef.current.filter((message) => !currentIds.has(message.id));
    const isCompaction = isRunning || wasRunningRef.current;

    previousLiveRef.current = liveMessages;

    if (isCompaction && departed.length > 0) setRetained((current) => [...current, ...departed]);
  }, [liveMessages, isRunning]);

  useEffect(() => {
    setRetained([]);
  }, [dataUpdatedAt]);

  useEffect(() => {
    if (wasRunningRef.current && !isRunning) void refetch();

    wasRunningRef.current = isRunning;
  }, [isRunning, refetch]);

  const fetchOlder = useCallback(() => {
    if (!hasPreviousPage) return;

    void fetchPreviousPage({ cancelRefetch: false });
  }, [fetchPreviousPage, hasPreviousPage]);

  const fetchNewer = useCallback(() => {
    if (!hasNextPage) return;

    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage, hasNextPage]);

  const archived = useMemo(
    () => [...toChatMessages(query.data?.pages ?? []), ...withoutSummaryMessages(retained)],
    [query.data, retained]
  );

  const visibleLive = withoutSummaryMessages(liveMessages);
  const messages = reconcileMessages(archived, visibleLive);

  return {
    fetchNewer,
    fetchOlder,
    hasNewer: hasNextPage,
    hasOlder: hasPreviousPage,
    isLoading: query.isPending && Boolean(threadId),
    isLoadingOlder: query.isFetchingPreviousPage,
    messages,
    olderError: query.isFetchPreviousPageError ? OLDER_HISTORY_ERROR : null,
    pageCount: query.data?.pages.length ?? 0,
    retryOlder: fetchOlder,
  };
};
