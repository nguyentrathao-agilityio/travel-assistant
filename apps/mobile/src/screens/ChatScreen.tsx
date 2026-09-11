import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { shellColors, shellRadii, shellSpacing } from '../theme';
import { renderableMessages } from '../utils/chatMessages';
import { ChatLayout, MessageBubble, VoiceButton } from '../components';

import type { VoiceState } from '../hooks';
import type { RenderableMessage } from '../utils/chatMessages';
import type { Message } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';

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

  useEffect(() => {
    if (rows.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [rows.length, messages, interruptElement]);

  const handleSend = () => {
    if (!draft.trim() || isRunning || isAwaitingApproval) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <LinearGradient
      colors={[shellColors.backgroundGradientStart, shellColors.backgroundGradientEnd]}
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
                onChangeText={setDraft}
                placeholder="Ask about your trip…"
                placeholderTextColor={shellColors.textOnDarkFaint}
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

const styles = StyleSheet.create({
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
    color: shellColors.textOnDarkMuted,
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
    borderColor: shellColors.danger,
    borderRadius: shellRadii.card,
    borderWidth: 1,
    marginBottom: shellSpacing.sm,
    padding: shellSpacing.sm,
  },
  errorText: {
    color: shellColors.danger,
    fontSize: 13,
  },
  voiceStatusBanner: {
    marginBottom: shellSpacing.sm,
  },
  voiceStatusText: {
    color: shellColors.textOnDarkMuted,
    fontSize: 13,
  },
  inputBar: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: shellSpacing.sm,
  },
  input: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.row,
    borderWidth: 1,
    color: shellColors.textOnDark,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    paddingHorizontal: shellSpacing.md,
    paddingVertical: shellSpacing.sm,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: shellColors.accentGradientStart,
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
    backgroundColor: shellColors.danger,
    borderRadius: shellRadii.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendIcon: {
    color: shellColors.textOnDark,
    fontSize: 16,
  },
});
