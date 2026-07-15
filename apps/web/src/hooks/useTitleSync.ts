import { useEffect } from 'react';
import { useCopilotChatHeadless_c } from '@copilotkit/react-core';

// Stores
import { useThreadStore } from '@/stores';

// Utils
import { extractCopilotText, isUserMessage } from '@/utils';

const TITLE_MAX_LENGTH = 50;

export const useTitleSync = () => {
  const { messages } = useCopilotChatHeadless_c();

  useEffect(() => {
    const { activeThreadId, threads, updateThread } = useThreadStore.getState();
    const activeThread = threads.find((thread) => thread.id === activeThreadId);

    if (activeThread?.title) return;

    const firstUserMessage = (messages as unknown[]).find(isUserMessage);
    if (!firstUserMessage) return;

    const text = extractCopilotText(firstUserMessage.content).trim();
    if (!text) return;

    const title = text.length > TITLE_MAX_LENGTH ? `${text.slice(0, TITLE_MAX_LENGTH)}…` : text;
    updateThread(activeThreadId, { title });
  }, [messages]);
};
