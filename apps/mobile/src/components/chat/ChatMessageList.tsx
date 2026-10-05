import type { Message, Suggestion } from '@copilotkit/react-native/headless';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

// Constants
import {
  CHAT_LIST_INITIAL_NUM_TO_RENDER,
  CHAT_LIST_MAX_TO_RENDER_PER_BATCH,
  CHAT_LIST_WINDOW_SIZE,
  CHAT_SCROLL_TO_LATEST_THRESHOLD,
  LIST_PAGINATION_THRESHOLD,
  LIVE_END_VISIBLE_CONTENT_POSITION,
  MAINTAIN_VISIBLE_CONTENT_POSITION,
} from '../../constants';

// Components
import { MessageBubble, ThinkingIndicator } from '../MessageBubble';
import { SuggestionChips } from '../SuggestionChips';
import { ChatScrollView } from './ChatScrollView';
import { ScrollToLatestButton } from './ScrollToLatestButton';

// Utils
import { shellSpacing, useShellTheme } from '../../theme';
import { buildToolMessageIndex, messageText, renderableMessages } from '../../utils/chatMessages';

// Types
import type { RenderableMessage } from '../../utils/chatMessages';

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
  scrollToLatest: (animated?: boolean) => void;
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
    const rows = useMemo(() => renderableMessages(messages), [messages]);
    const newestFirstRows = useMemo(() => [...rows].reverse(), [rows]);
    const toolMessageIndex = useMemo(() => buildToolMessageIndex(messages), [messages]);
    const lastRow = rows.at(-1);
    const hasEmptyAssistantRow =
      lastRow?.role === 'assistant' &&
      !messageText(lastRow.content).trim() &&
      !lastRow.toolCalls?.length;
    const isAwaitingApproval = interruptElement !== null;
    const canLoadOlder = hasOlder && !isLoadingOlder && !olderError;

    const [isAwayFromLatest, setIsAwayFromLatest] = useState(false);

    const scrollToLatest = useCallback((animated = true) => {
      listRef.current?.scrollToOffset({ animated, offset: 0 });
    }, []);

    useImperativeHandle(ref, () => ({ scrollToLatest }), [scrollToLatest]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIsAwayFromLatest(event.nativeEvent.contentOffset.y > CHAT_SCROLL_TO_LATEST_THRESHOLD);
    }, []);

    const handleScrollToLatestPress = useCallback(() => scrollToLatest(), [scrollToLatest]);

    const renderScrollComponent = useCallback(
      (props: ScrollViewProps) => (
        <ChatScrollView {...props} extraContentPadding={extraContentPadding} inverted />
      ),
      [extraContentPadding]
    );

    const olderHistoryRow = isLoadingOlder ? (
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
      <View style={styles.list}>
        <FlatList
          contentContainerStyle={styles.content}
          data={newestFirstRows}
          initialNumToRender={CHAT_LIST_INITIAL_NUM_TO_RENDER}
          inverted
          keyExtractor={(item) => item.id}
          ListFooterComponent={olderHistoryRow}
          ListHeaderComponent={
            <>
              {isRunning && !hasEmptyAssistantRow ? (
                <View style={styles.typingIndicatorWrap}>
                  <ThinkingIndicator />
                </View>
              ) : null}
              {interruptElement ? (
                <View style={styles.interruptWrap}>{interruptElement}</View>
              ) : null}
              {!isRunning && !isAwaitingApproval && suggestions.length > 0 ? (
                <SuggestionChips suggestions={suggestions} onSelect={onSuggestionPress} />
              ) : null}
            </>
          }
          maintainVisibleContentPosition={
            hasNewer ? MAINTAIN_VISIBLE_CONTENT_POSITION : LIVE_END_VISIBLE_CONTENT_POSITION
          }
          maxToRenderPerBatch={CHAT_LIST_MAX_TO_RENDER_PER_BATCH}
          onEndReached={canLoadOlder ? onLoadOlder : undefined}
          onEndReachedThreshold={LIST_PAGINATION_THRESHOLD}
          onScroll={handleScroll}
          onStartReached={hasNewer ? onLoadNewer : undefined}
          ref={listRef}
          renderItem={({ item }) => (
            <MessageBubble message={item} toolMessageIndex={toolMessageIndex} />
          )}
          renderScrollComponent={renderScrollComponent}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE_MS}
          style={styles.list}
          testID="chat-message-list"
          windowSize={CHAT_LIST_WINDOW_SIZE}
        />
        {isAwayFromLatest ? <ScrollToLatestButton onPress={handleScrollToLatestPress} /> : null}
      </View>
    );
  }
);

ChatMessageList.displayName = 'ChatMessageList';

const SCROLL_EVENT_THROTTLE_MS = 16;

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
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
