import { Mic, MicOff, Volume2 } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { shellColors, shellRadii } from '../theme';

import type { VoiceState } from '../hooks';

interface VoiceButtonProps {
  voiceState: VoiceState;
  disabled?: boolean;
  onStart: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

const ICON_SIZE = 20;

export const VoiceButton = ({
  voiceState,
  disabled = false,
  onStart,
  onStopListening,
  onStopSpeaking,
}: VoiceButtonProps) => {
  const handlePress = () => {
    if (voiceState === 'listening') {
      onStopListening();
      return;
    }

    if (voiceState === 'speaking') {
      onStopSpeaking();
      return;
    }

    if (disabled || voiceState === 'connecting' || voiceState === 'thinking') return;

    onStart();
  };

  // A pending approval or an in-flight run still allow cancelling an
  // already-active listen/speak session — only starting a new one is blocked.
  const isStartBlocked = disabled || voiceState === 'connecting' || voiceState === 'thinking';
  const canCancel = voiceState === 'listening' || voiceState === 'speaking';

  return (
    <Pressable
      accessibilityLabel={voiceLabel(voiceState)}
      accessibilityRole="button"
      disabled={isStartBlocked && !canCancel}
      onPress={handlePress}
      style={[styles.button, voiceState === 'listening' && styles.buttonActive]}
    >
      <VoiceIcon voiceState={voiceState} />
    </Pressable>
  );
};

const VoiceIcon = ({ voiceState }: { voiceState: VoiceState }) => {
  switch (voiceState) {
    case 'listening':
      return <Mic color={shellColors.textOnDark} size={ICON_SIZE} />;
    case 'connecting':
    case 'thinking':
      return <ActivityIndicator color={shellColors.textOnDarkMuted} />;
    case 'speaking':
      return <Volume2 color={shellColors.textOnDark} size={ICON_SIZE} />;
    case 'error':
      return <MicOff color={shellColors.danger} size={ICON_SIZE} />;
    default:
      return <Mic color={shellColors.textOnDarkMuted} size={ICON_SIZE} />;
  }
};

const voiceLabel = (voiceState: VoiceState): string => {
  switch (voiceState) {
    case 'listening':
      return 'Stop listening';
    case 'speaking':
      return 'Stop speaking';
    case 'connecting':
      return 'Connecting to voice session';
    case 'thinking':
      return 'Waiting for the response';
    case 'error':
      return 'Voice input unavailable, tap to retry';
    default:
      return 'Ask by voice';
  }
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  buttonActive: {
    backgroundColor: shellColors.danger,
    borderColor: shellColors.danger,
  },
});
