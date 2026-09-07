import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shellColors, shellRadii, shellSpacing } from '../theme';
import { renderableMessages } from '../utils/chatMessages';
import { MessageBubble } from './MessageBubble';

import type { RenderableMessage } from '../utils/chatMessages';
import type { Message } from '@copilotkit/react-native/headless';

interface ChatScreenProps {
  messages: Message[];
  isReady: boolean;
  isRunning: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onStop: () => void;
}

export const ChatScreen = ({
  messages,
  isReady,
  isRunning,
  error,
  onSend,
  onStop,
}: ChatScreenProps) => {
  const [draft, setDraft] = useState('');
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<RenderableMessage>>(null);
  const rows = renderableMessages(messages);

  useEffect(() => {
    if (rows.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [rows.length, messages]);

  const handleSend = () => {
    if (!draft.trim() || isRunning) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <LinearGradient
      colors={[shellColors.backgroundGradientStart, shellColors.backgroundGradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
        style={styles.container}
      >
        {!isReady ? (
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
            ref={listRef}
            renderItem={({ item }) => <MessageBubble allMessages={messages} message={item} />}
          />
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom || shellSpacing.md }]}>
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
              disabled={!draft.trim()}
              onPress={handleSend}
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
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
  centeredStateText: {
    color: shellColors.textOnDarkMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  listContent: {
    padding: shellSpacing.lg,
  },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderColor: shellColors.danger,
    borderRadius: shellRadii.card,
    borderWidth: 1,
    marginHorizontal: shellSpacing.lg,
    marginBottom: shellSpacing.sm,
    padding: shellSpacing.sm,
  },
  errorText: {
    color: shellColors.danger,
    fontSize: 13,
  },
  inputBar: {
    alignItems: 'flex-end',
    borderTopColor: shellColors.surfaceBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: shellSpacing.sm,
    padding: shellSpacing.md,
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
