import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { MIN_COMPOSER_INPUT_HEIGHT } from '../constants';
import { ChatLayout, VoiceModeOverlay } from '../components';
import { ChatComposer } from '../components/chat/ChatComposer';
import { ChatEmptyState } from '../components/chat/ChatEmptyState';
import { ChatHeader } from '../components/chat/ChatHeader';
import {
  ChatMessageList,
  type ChatMessageListHandle,
  type OlderHistoryProps,
} from '../components/chat/ChatMessageList';
import { shellSpacing, useShellTheme } from '../theme';
import { renderableMessages } from '../utils/chatMessages';

import type { ChatVoiceProps } from '../hooks';
import type { ShellColors } from '../theme';
import type { Message, Suggestion } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';

interface ChatScreenProps {
  threadId: string;
  history: OlderHistoryProps;
  messages: Message[];
  isReady: boolean;
  isRunning: boolean;
  error: string | null;
  interruptElement: ReactElement | null;
  suggestions: Suggestion[];
  voice: ChatVoiceProps;
  onBack: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
}

export const ChatScreen = ({
  threadId,
  messages,
  isReady,
  isRunning,
  error,
  interruptElement,
  suggestions,
  voice,
  history,
  onBack,
  onSend,
  onStop,
}: ChatScreenProps) => {
  const {
    agentTranscript,
    isVoiceModeActive,
    micLevel,
    onApprovalDecision,
    onExitVoiceMode,
    onStopVoiceModeTurn,
    partialTranscript,
    pendingApproval,
    voiceErrorMessage,
    voiceState,
  } = voice;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const messageListRef = useRef<ChatMessageListHandle>(null);
  const extraContentPadding = useSharedValue(0);
  const isAwaitingApproval = interruptElement !== null;
  const hasRenderableMessages = renderableMessages(messages).length > 0;

  useEffect(() => {
    if (isReady) {
      setIsTakingLong(false);
      return;
    }

    const timer = setTimeout(() => setIsTakingLong(true), 8000);

    return () => clearTimeout(timer);
  }, [isReady]);

  const handleComposerInputLayout = useCallback(
    (event: LayoutChangeEvent) => {
      extraContentPadding.value = withTiming(
        Math.max(event.nativeEvent.layout.height - MIN_COMPOSER_INPUT_HEIGHT, 0),
        { duration: 250 }
      );
    },
    [extraContentPadding]
  );

  const handleSuggestionPress = useCallback(
    (message: string) => {
      KeyboardController.dismiss();
      onSend(message);
    },
    [onSend]
  );

  const handleComposerSend = useCallback(
    (message: string) => {
      onSend(message);
      requestAnimationFrame(() => messageListRef.current?.scrollToLatest());
    },
    [onSend]
  );

  const messageContent = !isReady ? (
    <View style={styles.centeredState}>
      <ActivityIndicator
        accessibilityLabel="Loading"
        accessibilityRole="progressbar"
        color={colors.textOnDarkMuted}
        size="large"
      />
      {isTakingLong && (
        <Text style={styles.centeredStateText}>
          This is taking longer than usual — check your connection.
        </Text>
      )}
    </View>
  ) : !hasRenderableMessages ? (
    <ChatEmptyState
      disabled={isRunning || isAwaitingApproval}
      onSuggestionPress={handleSuggestionPress}
    />
  ) : (
    <ChatMessageList
      key={threadId}
      ref={messageListRef}
      {...history}
      extraContentPadding={extraContentPadding}
      interruptElement={interruptElement}
      isRunning={isRunning}
      messages={messages}
      onSuggestionPress={handleSuggestionPress}
      suggestions={suggestions}
    />
  );

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      end={{ x: 1, y: 0 }}
      start={{ x: 0.1, y: 1 }}
      style={styles.container}
    >
      <ChatLayout
        backgroundColor="transparent"
        composer={
          <ChatComposer
            error={error}
            isAwaitingApproval={isAwaitingApproval}
            isRunning={isRunning}
            onInputLayout={handleComposerInputLayout}
            onSend={handleComposerSend}
            onStop={onStop}
            voice={voice}
          />
        }
        header={<ChatHeader onBack={onBack} />}
        messages={messageContent}
      />
      {isVoiceModeActive && (
        <VoiceModeOverlay
          agentTranscript={agentTranscript}
          errorMessage={voiceErrorMessage}
          micLevel={micLevel}
          onApprovalDecision={onApprovalDecision}
          onExit={onExitVoiceMode}
          onStopTurn={onStopVoiceModeTurn}
          partialTranscript={partialTranscript}
          pendingApproval={pendingApproval}
          voiceState={voiceState}
        />
      )}
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
    centeredStateText: {
      color: colors.textOnDarkMuted,
      fontSize: 15,
      marginTop: shellSpacing.md,
      textAlign: 'center',
    },
  });
