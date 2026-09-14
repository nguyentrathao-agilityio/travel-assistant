import { LinearGradient } from 'expo-linear-gradient';
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
import { ChatLayout, MessageBubble, VoiceButton } from '../components';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { renderableMessages } from '../utils/chatMessages';

// Types
import type { VoiceState } from '../hooks';
import type { ShellColors } from '../theme';
import type { RenderableMessage } from '../utils/chatMessages';
import type { Message } from '@copilotkit/react-native/headless';
import type { KeyboardChatScrollViewProps } from 'react-native-keyboard-controller';
import type { ReactElement } from 'react';

const MIN_COMPOSER_INPUT_HEIGHT = 40;
const COMPOSER_BOTTOM_MARGIN = shellSpacing.xs;

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
  const isAwaitingApproval = interruptElement !== null;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      style={styles.container}
    >
      <ChatLayout
        backgroundColor="transparent"
        messages={
          !isReady ? (
            <View style={styles.centeredState}>
              <Text style={styles.centeredStateText}>Connecting…</Text>
            </View>
          ) : rows.length === 0 ? (
            <View style={styles.centeredState}>
              <Text style={styles.centeredStateText}>
                Ask me anything about your trip — flights, hotels, weather, or places to go.
              </Text>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={rows}
              keyExtractor={(item) => item.id}
              ListFooterComponent={
                interruptElement ? (
                  <View style={styles.interruptWrap}>{interruptElement}</View>
                ) : null
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
                placeholder="Ask about your trip…"
                placeholderTextColor={colors.textOnDarkFaint}
                style={styles.input}
                value={draft}
              />
              {isRunning ? (
                <Pressable accessibilityRole="button" onPress={onStop} style={styles.stopButton}>
                  <Text style={styles.sendIcon}>■</Text>
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
                  <Text style={styles.sendIcon}>➤</Text>
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
    centeredStateText: {
      color: colors.textOnDarkMuted,
      fontSize: 15,
      textAlign: 'center',
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: shellSpacing.lg,
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
      flexDirection: 'row',
      gap: shellSpacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.row,
      borderWidth: 1,
      color: colors.textOnDark,
      flex: 1,
      fontSize: 15,
      maxHeight: 120,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
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
    sendIcon: {
      color: colors.textOnDark,
      fontSize: 16,
    },
  });
