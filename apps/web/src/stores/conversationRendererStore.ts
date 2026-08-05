import { create } from 'zustand';
import type { MessagesProps } from '@copilotkit/react-ui';

export type SendMessage = (text: string) => Promise<unknown>;
type ConversationMessage = MessagesProps['messages'][number];

interface ConversationRendererState {
  threadId: string | null;
  persistedMessages: ConversationMessage[];
  isHistoryLoading: boolean;
  sendMessage: SendMessage | null;
  setThreadHistory: (threadId: string, messages: ConversationMessage[], isLoading: boolean) => void;
  setSendMessage: (sendMessage: SendMessage | null) => void;
}

/**
 * Ephemeral UI bridge between CopilotChat's renderer and the active LangGraph
 * thread. This store is intentionally not persisted.
 */
export const useConversationRendererStore = create<ConversationRendererState>((set) => ({
  threadId: null,
  persistedMessages: [],
  isHistoryLoading: false,
  sendMessage: null,
  setThreadHistory: (threadId, persistedMessages, isHistoryLoading) =>
    set({ threadId, persistedMessages, isHistoryLoading }),
  setSendMessage: (sendMessage) =>
    set((state) => (state.sendMessage === sendMessage ? state : { sendMessage })),
}));
