import { create } from 'zustand';

export type SendMessage = (text: string) => Promise<unknown>;

interface ConversationRendererState {
  threadId: string | null;
  isHistoryLoading: boolean;
  sendMessage: SendMessage | null;
  setHistoryStatus: (threadId: string, isLoading: boolean) => void;
  setSendMessage: (sendMessage: SendMessage | null) => void;
}

/**
 * Ephemeral UI bridge between CopilotChat's renderer and the active LangGraph
 * thread. This store is intentionally not persisted.
 */
export const useConversationRendererStore = create<ConversationRendererState>((set) => ({
  threadId: null,
  isHistoryLoading: false,
  sendMessage: null,
  setHistoryStatus: (threadId, isHistoryLoading) => set({ threadId, isHistoryLoading }),
  setSendMessage: (sendMessage) =>
    set((state) => (state.sendMessage === sendMessage ? state : { sendMessage })),
}));
