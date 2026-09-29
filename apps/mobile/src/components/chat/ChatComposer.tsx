import { AudioLines, Send, Square } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

// Constants
import { CHAT_COMPOSER_INPUT_NATIVE_ID, VOICE_STATE_LABEL, VOICE_STATES } from '../../constants';

// Components
import { VoiceButton } from '../VoiceButton';

// Utils
import { useShellTheme } from '../../theme';
import { createChatComposerStyles } from './ChatComposer.styles';

// Types
import type { ChatVoiceProps } from '../../hooks';
import type { LayoutChangeEvent } from 'react-native';

interface ChatComposerProps {
  error: string | null;
  isAwaitingApproval: boolean;
  isRunning: boolean;
  onInputLayout: (event: LayoutChangeEvent) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  voice: ChatVoiceProps;
}

export const ChatComposer = ({
  error,
  isAwaitingApproval,
  isRunning,
  onInputLayout,
  onSend,
  onStop,
  voice,
}: ChatComposerProps) => {
  const {
    dictatedTranscript,
    isVoiceModeActive,
    onStartListening,
    onStartVoiceMode,
    onStopListening,
    onStopSpeaking,
    voiceErrorMessage,
    voiceState,
  } = voice;
  const [draft, setDraft] = useState('');
  const { colors } = useShellTheme();
  const styles = useMemo(() => createChatComposerStyles(colors), [colors]);

  useEffect(() => {
    if (!dictatedTranscript) return;

    setDraft((previous) =>
      previous.trim() ? `${previous.trim()} ${dictatedTranscript.text}` : dictatedTranscript.text
    );
  }, [dictatedTranscript]);

  const handleSend = () => {
    if (!draft.trim() || isRunning || isAwaitingApproval) return;
    KeyboardController.dismiss();
    onSend(draft);
    setDraft('');
  };

  return (
    <>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {!isVoiceModeActive && voiceState === VOICE_STATES.ERROR && voiceErrorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{voiceErrorMessage}</Text>
        </View>
      )}
      {!isVoiceModeActive &&
        voiceState !== VOICE_STATES.IDLE &&
        voiceState !== VOICE_STATES.ERROR && (
          <View style={styles.voiceStatusBanner}>
            <Text style={styles.voiceStatusText}>{VOICE_STATE_LABEL[voiceState]}</Text>
          </View>
        )}
      <View style={styles.inputBar}>
        <VoiceButton
          disabled={isAwaitingApproval || isRunning || isVoiceModeActive}
          onStart={onStartListening}
          onStopListening={onStopListening}
          onStopSpeaking={onStopSpeaking}
          voiceState={voiceState}
        />
        <TextInput
          multiline
          nativeID={CHAT_COMPOSER_INPUT_NATIVE_ID}
          onChangeText={setDraft}
          onLayout={onInputLayout}
          placeholder="Write here…"
          placeholderTextColor={colors.textOnDarkFaint}
          style={styles.input}
          value={draft}
        />
        {isRunning ? (
          <Pressable
            accessibilityLabel="Stop"
            accessibilityRole="button"
            onPress={onStop}
            style={styles.stopButton}
          >
            <Square color={colors.textOnDark} fill={colors.textOnDark} size={14} />
          </Pressable>
        ) : draft.trim() ? (
          <Pressable
            accessibilityLabel="Send"
            accessibilityRole="button"
            disabled={isAwaitingApproval}
            onPress={handleSend}
            style={[styles.sendButton, isAwaitingApproval && styles.sendButtonDisabled]}
          >
            <Send color={colors.textOnDark} fill={colors.textOnDark} size={18} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Voice mode"
            accessibilityRole="button"
            disabled={isAwaitingApproval}
            onPress={onStartVoiceMode}
            style={[styles.sendButton, isAwaitingApproval && styles.sendButtonDisabled]}
          >
            <AudioLines color={colors.textOnDark} size={18} />
          </Pressable>
        )}
      </View>
    </>
  );
};
