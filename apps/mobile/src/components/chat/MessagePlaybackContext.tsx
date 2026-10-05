import { createContext, useContext } from 'react';

import type { ReactNode } from 'react';
import type { useMessagePlayback } from '../../hooks/useMessagePlayback';

export interface MessagePlaybackValue extends ReturnType<typeof useMessagePlayback> {
  recordings: ReadonlyMap<string, number>;
}

const MessagePlaybackContext = createContext<MessagePlaybackValue | null>(null);

/** Shares chat replay state with message bubbles without threading props through the list. */
export const MessagePlaybackProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: MessagePlaybackValue;
}) => <MessagePlaybackContext.Provider value={value}>{children}</MessagePlaybackContext.Provider>;

export const useMessagePlaybackContext = (): MessagePlaybackValue | null =>
  useContext(MessagePlaybackContext);
