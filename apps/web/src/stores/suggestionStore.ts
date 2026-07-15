import { create } from 'zustand';

type SendFn = (text: string) => Promise<unknown>;

interface SuggestionState {
  lastTool: string | null;
  onSend: SendFn | null;
  setLastTool: (tool: string | null) => void;
  setOnSend: (fn: SendFn | null) => void;
}

export const useSuggestionStore = create<SuggestionState>((set) => ({
  lastTool: null,
  onSend: null,
  setLastTool: (tool) => set({ lastTool: tool }),
  setOnSend: (fn) => set({ onSend: fn }),
}));
