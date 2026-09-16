import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Building2, Compass, MapPin, Plane, Send, Square } from 'lucide-react-native';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
} from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { CHAT_COMPOSER_INPUT_NATIVE_ID } from '../constants';

// Components
import {
  ChatLayout,
  LoadingState,
  MessageBubble,
  ThinkingIndicator,
  VoiceButton,
} from '../components';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { messageText, renderableMessages } from '../utils/chatMessages';

// Types
import type { VoiceState } from '../hooks';
import type { ShellColors } from '../theme';
import type { RenderableMessage } from '../utils/chatMessages';
import type { LucideIcon } from 'lucide-react-native';
import type { Message } from '@copilotkit/react-native/headless';
import type { KeyboardChatScrollViewProps } from 'react-native-keyboard-controller';
import type { ReactElement } from 'react';

const MIN_COMPOSER_INPUT_HEIGHT = 40;
const COMPOSER_BOTTOM_MARGIN = shellSpacing.xs;

const EMPTY_STATE_SUGGESTIONS: Array<{
  description: string;
  icon: LucideIcon;
  message: string;
  title: string;
}> = [
  {
    description: 'Trip Summary for Da Nang',
    icon: Compass,
    message: 'Trip Summary for Da Nang',
    title: 'Plan my trip',
  },
  {
    description: 'Find places to visit in Da Nang',
    icon: MapPin,
    message: 'Show me places to visit in Da Nang',
    title: 'Find places',
  },
  {
    description: 'Find hotels in Hoi An',
    icon: Building2,
    message: 'Show hotels in Hoi An',
    title: 'Find hotels',
  },
  {
    description: 'Find flights to Bangkok',
    icon: Plane,
    message: 'Find flights to Bangkok',
    title: 'Find flights',
  },
];

const DESTINATION_PILLS = ['Da Nang', 'Hanoi', 'Bangkok', 'Tokyo'] as const;

const ChatScrollView = forwardRef<
  React.ComponentRef<typeof KeyboardChatScrollView>,
  ScrollViewProps & KeyboardChatScrollViewProps
>((props, ref) => {
  const insets = useSafeAreaInsets();
  const restingBottomInset = Math.max(insets.bottom, shellSpacing.md);

  return (
    <KeyboardChatScrollView
      ref={ref}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      keyboardLiftBehavior="always"
      offset={restingBottomInset - COMPOSER_BOTTOM_MARGIN}
      {...props}
    />
  );
});
ChatScrollView.displayName = 'ChatScrollView';

interface ChatScreenProps {
  messages: Message[];
  isReady: boolean;
  isRunning: boolean;
  error: string | null;
  interruptElement: ReactElement | null;
  voiceState: VoiceState;
  voiceErrorMessage: string | null;
  onSend: (text: string) => void;
  onStop: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

const VOICE_STATUS_LABEL: Record<Exclude<VoiceState, 'idle' | 'error'>, string> = {
  connecting: 'Connecting…',
  listening: 'Listening…',
  speaking: 'Speaking…',
  thinking: 'Thinking…',
};

export const ChatScreen = ({
  messages,
  isReady,
  isRunning,
  error,
  interruptElement,
  voiceState,
  voiceErrorMessage,
  onSend,
  onStop,
  onStartListening,
  onStopListening,
  onStopSpeaking,
}: ChatScreenProps) => {
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<RenderableMessage>>(null);
  const rows = renderableMessages(messages);
  const lastRow = rows.at(-1);
  const hasEmptyAssistantRow =
    lastRow?.role === 'assistant' &&
    !messageText(lastRow.content).trim() &&
    !lastRow.toolCalls?.length;
  const isAwaitingApproval = interruptElement !== null;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    if (isReady) {
      setIsTakingLong(false);
      return;
    }

    const timer = setTimeout(() => setIsTakingLong(true), 8000);

    return () => clearTimeout(timer);
  }, [isReady]);

  const isAtBottomRef = useRef(true);
  const onEndVisible = useCallback((visible: boolean) => {
    isAtBottomRef.current = visible;
  }, []);

  const extraContentPadding = useSharedValue(0);
  const onComposerInputLayout = useCallback(
    (event: LayoutChangeEvent) => {
      extraContentPadding.value = withTiming(
        Math.max(event.nativeEvent.layout.height - MIN_COMPOSER_INPUT_HEIGHT, 0),
        { duration: 250 }
      );
    },
    [extraContentPadding]
  );
  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollView
        {...props}
        extraContentPadding={extraContentPadding}
        onEndVisible={onEndVisible}
      />
    ),
    [extraContentPadding, onEndVisible]
  );

  useEffect(() => {
    if (rows.length > 0 && isAtBottomRef.current) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [rows.length, messages, interruptElement]);

  const handleSend = () => {
    if (!draft.trim() || isRunning || isAwaitingApproval) return;
    onSend(draft);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      end={{ x: 1, y: 0 }}
      start={{ x: 0.1, y: 1 }}
      style={styles.container}
    >
      <ChatLayout
        backgroundColor="transparent"
        messages={
          !isReady ? (
            <View style={styles.centeredState}>
              <LoadingState lines={2} />
              {isTakingLong && (
                <Text style={styles.centeredStateText}>
                  This is taking longer than usual — check your connection.
                </Text>
              )}
            </View>
          ) : rows.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyTitleWrap}>
                <Text style={styles.emptyTitle}>Where to next?</Text>
                <Text style={styles.emptyDescription}>
                  I&apos;ll help you plan the trip — itineraries, flights, places to stay, and where
                  the locals actually eat.
                </Text>
                <View style={styles.destinationPills}>
                  {DESTINATION_PILLS.map((city) => (
                    <Pressable
                      accessibilityRole="button"
                      disabled={isRunning || isAwaitingApproval}
                      key={city}
                      onPress={() => onSend(`Plan a trip to ${city}`)}
                      style={styles.destinationPill}
                    >
                      <Text style={styles.destinationPillLabel}>{city}</Text>
                      <ArrowRight color={colors.textOnDark} size={12} />
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.quickActions}>
                {EMPTY_STATE_SUGGESTIONS.map(
                  ({ description, icon: ActionIcon, message, title }) => (
                    <Pressable
                      accessibilityRole="button"
                      disabled={isRunning || isAwaitingApproval}
                      key={title}
                      onPress={() => onSend(message)}
                      style={styles.quickAction}
                    >
                      <ActionIcon color={colors.textOnDarkMuted} size={18} strokeWidth={2.1} />
                      <View style={styles.quickActionCopy}>
                        <Text numberOfLines={1} style={styles.quickActionLabel}>
                          {title}
                        </Text>
                        <Text numberOfLines={1} style={styles.quickActionDescription}>
                          {description}
                        </Text>
                      </View>
                    </Pressable>
                  )
                )}
              </View>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={rows}
              keyExtractor={(item) => item.id}
              ListFooterComponent={
                <>
                  {isRunning && !hasEmptyAssistantRow ? (
                    <View style={styles.typingIndicatorWrap}>
                      <ThinkingIndicator />
                    </View>
                  ) : null}
                  {interruptElement ? (
                    <View style={styles.interruptWrap}>{interruptElement}</View>
                  ) : null}
                </>
              }
              ref={listRef}
              renderItem={({ item }) => <MessageBubble allMessages={messages} message={item} />}
              renderScrollComponent={renderScrollComponent}
              style={styles.list}
            />
          )
        }
        composer={
          <>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {voiceState === 'error' && voiceErrorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{voiceErrorMessage}</Text>
              </View>
            )}
            {voiceState !== 'idle' && voiceState !== 'error' && (
              <View style={styles.voiceStatusBanner}>
                <Text style={styles.voiceStatusText}>{VOICE_STATUS_LABEL[voiceState]}</Text>
              </View>
            )}
            <View style={styles.inputBar}>
              <VoiceButton
                disabled={isAwaitingApproval}
                onStart={onStartListening}
                onStopListening={onStopListening}
                onStopSpeaking={onStopSpeaking}
                voiceState={voiceState}
              />
              <TextInput
                multiline
                nativeID={CHAT_COMPOSER_INPUT_NATIVE_ID}
                onChangeText={setDraft}
                onLayout={onComposerInputLayout}
                placeholder="Write here…"
                placeholderTextColor={colors.textOnDarkFaint}
                style={styles.input}
                value={draft}
              />
              {isRunning ? (
                <Pressable accessibilityRole="button" onPress={onStop} style={styles.stopButton}>
                  <Square color={colors.textOnDark} fill={colors.textOnDark} size={14} />
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={!draft.trim() || isAwaitingApproval}
                  onPress={handleSend}
                  style={[
                    styles.sendButton,
                    (!draft.trim() || isAwaitingApproval) && styles.sendButtonDisabled,
                  ]}
                >
                  <Send color={colors.textOnDark} fill={colors.textOnDark} size={18} />
                </Pressable>
              )}
            </View>
          </>
        }
      />
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    centeredState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: shellSpacing.xl,
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
    centeredStateText: {
      color: colors.textOnDarkMuted,
      fontSize: 15,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: 92,
      paddingHorizontal: shellSpacing.md,
    },
    emptyTitleWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: shellSpacing.xl,
    },
    emptyTitle: {
      color: colors.textOnDark,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptyDescription: {
      color: colors.textOnDarkMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: shellSpacing.sm,
      maxWidth: 340,
      textAlign: 'center',
    },
    destinationPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
      marginTop: shellSpacing.md,
    },
    destinationPill: {
      alignItems: 'center',
      backgroundColor: `${colors.accentGradientEnd}2e`,
      borderColor: colors.surfaceBorder,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.xs,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    destinationPillLabel: {
      color: colors.textOnDark,
      fontSize: 12,
      fontWeight: '600',
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: shellSpacing.sm,
      width: '100%',
    },
    quickAction: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: 16,
      borderWidth: 1,
      flexBasis: '48%',
      flexDirection: 'row',
      flexGrow: 1,
      gap: shellSpacing.sm,
      minHeight: 72,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    quickActionCopy: {
      flex: 1,
      gap: shellSpacing.xs,
      justifyContent: 'center',
    },
    quickActionLabel: {
      color: colors.textOnDark,
      fontSize: 14,
      fontWeight: '600',
    },
    quickActionDescription: {
      color: colors.textOnDarkFaint,
      fontSize: 11,
      lineHeight: 15,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: shellSpacing.lg,
      paddingVertical: shellSpacing.xl,
    },
    errorBanner: {
      backgroundColor: 'rgba(248, 113, 113, 0.16)',
      borderColor: colors.danger,
      borderRadius: shellRadii.card,
      borderWidth: 1,
      marginBottom: shellSpacing.sm,
      padding: shellSpacing.sm,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    voiceStatusBanner: {
      marginBottom: shellSpacing.sm,
    },
    voiceStatusText: {
      color: colors.textOnDarkMuted,
      fontSize: 13,
    },
    inputBar: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.row,
      borderWidth: 1,
      flexDirection: 'row',
      padding: shellSpacing.xs,
    },
    input: {
      backgroundColor: 'transparent',
      color: colors.textOnDark,
      flex: 1,
      fontSize: 15,
      maxHeight: 120,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    sendButton: {
      alignItems: 'center',
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.pill,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
    stopButton: {
      alignItems: 'center',
      backgroundColor: colors.danger,
      borderRadius: shellRadii.pill,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
  });
