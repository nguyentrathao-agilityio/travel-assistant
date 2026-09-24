import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { MessageBubble, ThinkingIndicator } from '../MessageBubble';
import { SuggestionChips } from '../SuggestionChips';
import { shellSpacing } from '../../theme';
import { buildToolMessageIndex, messageText, renderableMessages } from '../../utils/chatMessages';
import { ChatScrollView } from './ChatScrollView';

import type { RenderableMessage } from '../../utils/chatMessages';
import type { Message, Suggestion } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';
import type { ScrollViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export interface ChatMessageListHandle {
  scrollToEnd: (animated?: boolean) => void;
}

interface ChatMessageListProps {
  extraContentPadding: SharedValue<number>;
  interruptElement: ReactElement | null;
  isRunning: boolean;
  messages: Message[];
  onSuggestionPress: (message: string) => void;
  suggestions: Suggestion[];
}

export const ChatMessageList = forwardRef<ChatMessageListHandle, ChatMessageListProps>(
  (
    { extraContentPadding, interruptElement, isRunning, messages, onSuggestionPress, suggestions },
    ref
  ) => {
    const listRef = useRef<FlatList<RenderableMessage>>(null);
    const isAtBottomRef = useRef(true);
    const rows = renderableMessages(messages);
    const toolMessageIndex = useMemo(() => buildToolMessageIndex(messages), [messages]);
    const lastRow = rows.at(-1);
    const hasEmptyAssistantRow =
      lastRow?.role === 'assistant' &&
      !messageText(lastRow.content).trim() &&
      !lastRow.toolCalls?.length;
    const isAwaitingApproval = interruptElement !== null;

    useImperativeHandle(ref, () => ({
      scrollToEnd: (animated = true) => listRef.current?.scrollToEnd({ animated }),
    }));

    useEffect(() => {
      if (rows.length > 0 && isAtBottomRef.current) {
        listRef.current?.scrollToEnd({ animated: true });
      }
    }, [rows.length, messages, interruptElement]);

    const renderScrollComponent = useCallback(
      (props: ScrollViewProps) => (
        <ChatScrollView
          {...props}
          extraContentPadding={extraContentPadding}
          onEndVisible={(visible) => {
            isAtBottomRef.current = visible;
          }}
        />
      ),
      [extraContentPadding]
    );

    return (
      <FlatList
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(item) => item.id}
        ListFooterComponent={
          <>
            {isRunning && !hasEmptyAssistantRow ? (
              <View style={styles.typingIndicatorWrap}>
                <ThinkingIndicator />
              </View>
            ) : null}
            {interruptElement ? <View style={styles.interruptWrap}>{interruptElement}</View> : null}
            {!isRunning && !isAwaitingApproval && suggestions.length > 0 ? (
              <SuggestionChips suggestions={suggestions} onSelect={onSuggestionPress} />
            ) : null}
          </>
        }
        ref={listRef}
        renderItem={({ item }) => (
          <MessageBubble message={item} toolMessageIndex={toolMessageIndex} />
        )}
        renderScrollComponent={renderScrollComponent}
        style={styles.list}
      />
    );
  }
);

ChatMessageList.displayName = 'ChatMessageList';

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: shellSpacing.lg,
    paddingVertical: shellSpacing.xl,
  },
  interruptWrap: {
    alignItems: 'flex-start',
    marginTop: shellSpacing.md,
  },
  typingIndicatorWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: shellSpacing.sm,
    paddingVertical: shellSpacing.xs,
  },
});
