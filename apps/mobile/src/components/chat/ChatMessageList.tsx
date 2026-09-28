import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CHAT_LIST_INITIAL_NUM_TO_RENDER,
  CHAT_LIST_MAX_TO_RENDER_PER_BATCH,
  CHAT_LIST_WINDOW_SIZE,
} from '../../constants';
import { MessageBubble, ThinkingIndicator } from '../MessageBubble';
import { SuggestionChips } from '../SuggestionChips';
import { shellSpacing, useShellTheme } from '../../theme';
import { buildToolMessageIndex, messageText, renderableMessages } from '../../utils/chatMessages';
import { ChatScrollView } from './ChatScrollView';

import type { RenderableMessage } from '../../utils/chatMessages';
import type { Message, Suggestion } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

// Distance from the top of the list, in points, at which the previous transcript page is requested.
const LOAD_OLDER_THRESHOLD = 80;
const MAINTAIN_VISIBLE_CONTENT_POSITION = { minIndexForVisible: 1 };

export interface OlderHistoryProps {
  hasNewer: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  olderError: string | null;
  onLoadNewer: () => void;
  onLoadOlder: () => void;
  onRetryOlder: () => void;
}

export interface ChatMessageListHandle {
  scrollToEnd: (animated?: boolean) => void;
}

interface ChatMessageListProps extends OlderHistoryProps {
  extraContentPadding: SharedValue<number>;
  interruptElement: ReactElement | null;
  isRunning: boolean;
  messages: Message[];
  onSuggestionPress: (message: string) => void;
  suggestions: Suggestion[];
}

export const ChatMessageList = forwardRef<ChatMessageListHandle, ChatMessageListProps>(
  (
    {
      extraContentPadding,
      hasNewer,
      hasOlder,
      interruptElement,
      isLoadingOlder,
      isRunning,
      messages,
      olderError,
      onLoadNewer,
      onLoadOlder,
      onRetryOlder,
      onSuggestionPress,
      suggestions,
    },
    ref
  ) => {
    const { colors } = useShellTheme();
    const listRef = useRef<FlatList<RenderableMessage>>(null);
    const isAtBottomRef = useRef(true);
    const olderRequestedRef = useRef(false);
    // True until the user first drags the list: the opened thread keeps snapping to its newest message.
    const isInitialScrollRef = useRef(true);
    const edgeIdsRef = useRef<{ first?: string; last?: string }>({});
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

    const firstRowId = rows[0]?.id;
    const lastRowId = lastRow?.id;

    // Auto-scrolls to new content only; a prepended older page keeps the last row and must not scroll.
    useEffect(() => {
      const previous = edgeIdsRef.current;
      const isPrepend = previous.first !== firstRowId && previous.last === lastRowId;

      edgeIdsRef.current = { first: firstRowId, last: lastRowId };

      if (!isPrepend && rows.length > 0 && isAtBottomRef.current) {
        listRef.current?.scrollToEnd({ animated: true });
      }
    }, [rows.length, messages, interruptElement, firstRowId, lastRowId, suggestions.length]);

    useEffect(() => {
      if (!isLoadingOlder) olderRequestedRef.current = false;
    }, [isLoadingOlder]);

    const handleContentSizeChange = useCallback(() => {
      if (isInitialScrollRef.current) listRef.current?.scrollToEnd({ animated: false });
    }, []);

    const handleScrollBeginDrag = useCallback(() => {
      isInitialScrollRef.current = false;
    }, []);

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isInitialScrollRef.current) return;

        if (event.nativeEvent.contentOffset.y > LOAD_OLDER_THRESHOLD) {
          olderRequestedRef.current = false;
          return;
        }

        if (!hasOlder || isLoadingOlder || olderError || olderRequestedRef.current) return;

        olderRequestedRef.current = true;
        onLoadOlder();
      },
      [hasOlder, isLoadingOlder, olderError, onLoadOlder]
    );

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

    const olderHistoryHeader = isLoadingOlder ? (
      <View style={styles.olderHistoryRow}>
        <ActivityIndicator
          accessibilityLabel="Loading older messages"
          accessibilityRole="progressbar"
          color={colors.textOnDarkMuted}
        />
      </View>
    ) : olderError ? (
      <View style={styles.olderHistoryRow}>
        <Text style={[styles.olderHistoryText, { color: colors.textOnDarkMuted }]}>
          {olderError}
        </Text>
        <Pressable
          accessibilityLabel="Retry loading older messages"
          accessibilityRole="button"
          hitSlop={shellSpacing.sm}
          onPress={onRetryOlder}
        >
          <Text style={[styles.olderHistoryRetry, { color: colors.textOnDark }]}>Retry</Text>
        </Pressable>
      </View>
    ) : null;

    return (
      <FlatList
        contentContainerStyle={styles.content}
        data={rows}
        initialNumToRender={CHAT_LIST_INITIAL_NUM_TO_RENDER}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={olderHistoryHeader}
        maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
        maxToRenderPerBatch={CHAT_LIST_MAX_TO_RENDER_PER_BATCH}
        onContentSizeChange={handleContentSizeChange}
        onEndReached={hasNewer ? onLoadNewer : undefined}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={100}
        testID="chat-message-list"
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
        windowSize={CHAT_LIST_WINDOW_SIZE}
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
  olderHistoryRow: {
    alignItems: 'center',
    gap: shellSpacing.xs,
    paddingBottom: shellSpacing.md,
  },
  olderHistoryText: {
    fontSize: 13,
    textAlign: 'center',
  },
  olderHistoryRetry: {
    fontSize: 14,
    fontWeight: '600',
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
