import { Mic, MicOff, Volume2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

// Constants
import { HEADER_ICON_SIZE, VOICE_STATES } from '../constants';

// Utils
import { shellRadii, useShellTheme } from '../theme';

// Types
import type { VoiceState } from '../hooks';
import type { ShellColors } from '../theme';

interface VoiceButtonProps {
  voiceState: VoiceState;
  disabled?: boolean;
  onStart: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

export const VoiceButton = ({
  voiceState,
  disabled = false,
  onStart,
  onStopListening,
  onStopSpeaking,
}: VoiceButtonProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = () => {
    if (voiceState === VOICE_STATES.LISTENING) {
      onStopListening();
      return;
    }

    if (voiceState === VOICE_STATES.SPEAKING) {
      onStopSpeaking();
      return;
    }

    if (
      disabled ||
      voiceState === VOICE_STATES.CONNECTING ||
      voiceState === VOICE_STATES.PROCESSING ||
      voiceState === VOICE_STATES.THINKING
    )
      return;

    onStart();
  };

  // A pending approval or an in-flight run still allow cancelling an
  // already-active listen/speak session — only starting a new one is blocked.
  const isStartBlocked =
    disabled ||
    voiceState === VOICE_STATES.CONNECTING ||
    voiceState === VOICE_STATES.PROCESSING ||
    voiceState === VOICE_STATES.THINKING;
  const canCancel = voiceState === VOICE_STATES.LISTENING || voiceState === VOICE_STATES.SPEAKING;

  return (
    <Pressable
      accessibilityLabel={voiceLabel(voiceState)}
      accessibilityRole="button"
      disabled={isStartBlocked && !canCancel}
      onPress={handlePress}
      style={[styles.button, voiceState === VOICE_STATES.LISTENING && styles.buttonActive]}
    >
      <VoiceIcon voiceState={voiceState} />
    </Pressable>
  );
};

const VoiceIcon = ({ voiceState }: { voiceState: VoiceState }) => {
  const { colors } = useShellTheme();

  switch (voiceState) {
    case VOICE_STATES.LISTENING:
      return <Mic color={colors.textOnDark} size={HEADER_ICON_SIZE} />;
    case VOICE_STATES.CONNECTING:
    case VOICE_STATES.PROCESSING:
    case VOICE_STATES.THINKING:
      return <ActivityIndicator color={colors.textOnDarkMuted} />;
    case VOICE_STATES.SPEAKING:
      return <Volume2 color={colors.textOnDark} size={HEADER_ICON_SIZE} />;
    case VOICE_STATES.ERROR:
      return <MicOff color={colors.danger} size={HEADER_ICON_SIZE} />;
    default:
      return <Mic color={colors.textOnDarkMuted} size={HEADER_ICON_SIZE} />;
  }
};

const voiceLabel = (voiceState: VoiceState): string => {
  switch (voiceState) {
    case VOICE_STATES.LISTENING:
      return 'Stop listening';
    case VOICE_STATES.SPEAKING:
      return 'Stop speaking';
    case VOICE_STATES.CONNECTING:
      return 'Connecting to voice session';
    case VOICE_STATES.PROCESSING:
      return 'Processing voice input';
    case VOICE_STATES.THINKING:
      return 'Waiting for the response';
    case VOICE_STATES.ERROR:
      return 'Voice input unavailable, tap to retry';
    default:
      return 'Ask by voice';
  }
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    buttonActive: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
  });
