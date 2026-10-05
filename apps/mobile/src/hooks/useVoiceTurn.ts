import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { VOICE_TURN_EVENT_TYPES } from '@repo/constants';
import { clientTimezone, todayClientIso } from '@repo/utils';

// Services
import { streamVoiceTurn } from '../services/voiceTurn';

// Utils
import { voiceTurnErrorMessage, voiceTurnRequestErrorMessage } from '../utils/voice';
import {
  createVoiceSpeechQueue,
  defaultVoiceSpeechQueueDeps,
  type VoiceSpeechQueueDeps,
} from '../utils/voiceSpeechQueue';

// Types
import type { VoiceTurnEvent, VoiceTurnRequest } from '@repo/schemas';

interface UseVoiceTurnOptions {
  threadId: string;
  onSettled?: () => void;
  onFinished?: () => void;
  stream?: typeof streamVoiceTurn;
  speechQueueDeps?: VoiceSpeechQueueDeps;
}

/** One server voice turn: streams the reply, speaks its sentences in order, handles approval; `onFinished` once reply and audio are done. */
export const useVoiceTurn = ({
  threadId,
  onSettled,
  onFinished,
  stream = streamVoiceTurn,
  speechQueueDeps = defaultVoiceSpeechQueueDeps,
}: UseVoiceTurnOptions) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentTranscript, setAgentTranscript] = useState('');
  const [pendingApproval, setPendingApproval] = useState<unknown | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const finishedRequestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const isRequestDoneRef = useRef(true);
  const isPlaybackDoneRef = useRef(true);
  const isAwaitingApprovalRef = useRef(false);
  const latestRef = useRef({ onFinished, onSettled, stream, threadId });

  latestRef.current = { onFinished, onSettled, stream, threadId };

  const finishIfDone = useCallback(() => {
    const requestId = requestIdRef.current;

    if (!isRequestDoneRef.current || !isPlaybackDoneRef.current) return;
    if (isAwaitingApprovalRef.current || finishedRequestIdRef.current === requestId) return;

    finishedRequestIdRef.current = requestId;
    latestRef.current.onFinished?.();
  }, []);

  const queue = useMemo(
    () =>
      createVoiceSpeechQueue(speechQueueDeps, () => {
        isPlaybackDoneRef.current = true;
        setIsSpeaking(false);
        finishIfDone();
      }),
    [speechQueueDeps, finishIfDone]
  );

  const handleEvent = useCallback(
    (event: VoiceTurnEvent) => {
      switch (event.type) {
        case VOICE_TURN_EVENT_TYPES.AGENT_CHUNK:
          setAgentTranscript((previous) => previous + event.text);
          return;
        case VOICE_TURN_EVENT_TYPES.AGENT_INTERRUPT:
          isAwaitingApprovalRef.current = true;
          setPendingApproval(event.value ?? null);
          latestRef.current.onSettled?.();
          return;
        case VOICE_TURN_EVENT_TYPES.AGENT_END:
          if (event.error) setErrorMessage(voiceTurnErrorMessage(event.error.code));

          latestRef.current.onSettled?.();
          return;
        case VOICE_TURN_EVENT_TYPES.SPEECH_SEGMENT:
          isPlaybackDoneRef.current = false;
          setIsSpeaking(true);
          queue.enqueue(event.text);
          return;
        case VOICE_TURN_EVENT_TYPES.SPEECH_END:
          queue.markBatchEnd();
          return;
      }
    },
    [queue]
  );

  const run = useCallback(
    (body: VoiceTurnRequest) => {
      controllerRef.current?.abort();

      const requestId = requestIdRef.current + 1;
      const controller = new AbortController();
      const isCurrent = () => requestIdRef.current === requestId;

      requestIdRef.current = requestId;
      controllerRef.current = controller;
      isRequestDoneRef.current = false;
      isPlaybackDoneRef.current = true;
      setIsRunning(true);
      setErrorMessage(null);
      setAgentTranscript('');

      const streamTurn = async () => {
        try {
          await latestRef.current.stream({
            body,
            onEvent: (event) => {
              if (isCurrent()) handleEvent(event);
            },
            signal: controller.signal,
          });
        } catch (error) {
          if (!isCurrent() || controller.signal.aborted) return;

          setErrorMessage(voiceTurnRequestErrorMessage(error));
          latestRef.current.onSettled?.();
        } finally {
          if (isCurrent()) {
            isRequestDoneRef.current = true;
            setIsRunning(false);
            finishIfDone();
          }
        }
      };

      void streamTurn();
    },
    [finishIfDone, handleEvent]
  );

  const resetApproval = useCallback(() => {
    queue.clear();
    setIsSpeaking(false);
    isAwaitingApprovalRef.current = false;
    setPendingApproval(null);
  }, [queue]);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    resetApproval();
    isRequestDoneRef.current = true;
    isPlaybackDoneRef.current = true;
    setIsRunning(false);
  }, [resetApproval]);

  const start = useCallback(
    (transcript: string, messageId?: string) => {
      resetApproval();
      run({
        clientDate: todayClientIso(),
        clientTimezone: clientTimezone(),
        ...(messageId && { messageId }),
        threadId: latestRef.current.threadId,
        transcript,
      });
    },
    [resetApproval, run]
  );

  const respondToApproval = useCallback(
    (resume: unknown) => {
      if (!isAwaitingApprovalRef.current) return;

      resetApproval();
      run({ resume, threadId: latestRef.current.threadId });
    },
    [resetApproval, run]
  );

  const stopRef = useRef(stop);
  stopRef.current = stop;

  useEffect(() => () => stopRef.current(), []);

  return {
    agentTranscript,
    errorMessage,
    isRunning,
    isSpeaking,
    pendingApproval,
    respondToApproval,
    start,
    stop,
  };
};
