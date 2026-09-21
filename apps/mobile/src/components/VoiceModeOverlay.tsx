import { LinearGradient } from 'expo-linear-gradient';
import { Keyboard, Mic, X } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { VOICE_STATES } from '../constants';

// Utils
import { shellSpacing, useShellTheme } from '../theme';

// Types
import type { VoiceState } from '../hooks';
import type { ShellColors } from '../theme';
import type { SharedValue } from 'react-native-reanimated';

interface VoiceModeOverlayProps {
  voiceState: VoiceState;
  errorMessage: string | null;
  partialTranscript: string;
  micLevel: SharedValue<number>;
  onExit: () => void;
  onStopTurn: () => void;
}

const STATE_LABEL: Record<VoiceState, string> = {
  [VOICE_STATES.CONNECTING]: 'Connecting…',
  [VOICE_STATES.ERROR]: 'Something went wrong',
  [VOICE_STATES.IDLE]: 'Tap the mic to talk',
  [VOICE_STATES.LISTENING]: 'Listening…',
  [VOICE_STATES.SPEAKING]: 'Speaking…',
  [VOICE_STATES.THINKING]: 'Thinking…',
};

const BAR_MULTIPLIERS = [0.35, 0.65, 1, 0.65, 0.35];
const BAR_MIN_HEIGHT = 10;
const BAR_MAX_HEIGHT = 72;

const WaveformBar = ({
  level,
  multiplier,
  color,
}: {
  level: SharedValue<number>;
  multiplier: number;
  color: string;
}) => {
  const style = useAnimatedStyle(() => ({
    height: interpolate(
      level.value * multiplier,
      [0, 1],
      [BAR_MIN_HEIGHT, BAR_MAX_HEIGHT],
      Extrapolation.CLAMP
    ),
  }));

  return <Animated.View style={[waveformStyles.bar, { backgroundColor: color }, style]} />;
};

// Real mic volume drives the bars while listening. There's no equivalent signal
// for `speaking`/`thinking`/`connecting` (expo-speech doesn't expose TTS playback
// amplitude), so those states get a gentle decorative idle pulse instead.
const Waveform = ({
  voiceState,
  micLevel,
  colors,
}: {
  voiceState: VoiceState;
  micLevel: SharedValue<number>;
  colors: ShellColors;
}) => {
  const idleLevel = useSharedValue(0.2);

  useEffect(() => {
    if (voiceState === VOICE_STATES.LISTENING) {
      idleLevel.value = 0.2;
      return;
    }

    idleLevel.value = withRepeat(
      withSequence(withTiming(0.75, { duration: 550 }), withTiming(0.2, { duration: 550 })),
      -1,
      true
    );
  }, [voiceState, idleLevel]);

  const effectiveLevel = useDerivedValue(() =>
    voiceState === VOICE_STATES.LISTENING ? micLevel.value : idleLevel.value
  );

  const barColors = [
    colors.accentGradientStart,
    colors.accentGradientEnd,
    colors.accentGradientEnd,
    colors.accentGradientEnd,
    colors.accentGradientStart,
  ];

  return (
    <View style={waveformStyles.row}>
      {BAR_MULTIPLIERS.map((multiplier, index) => (
        <WaveformBar
          color={barColors[index]}
          key={index}
          level={effectiveLevel}
          multiplier={multiplier}
        />
      ))}
    </View>
  );
};

const waveformStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: BAR_MAX_HEIGHT,
  },
  bar: {
    borderRadius: 4,
    width: 8,
  },
});

// Distinct from VoiceButton's own "Stop listening"/"Stop speaking" labels —
// both are on screen at once (the composer's mic sits disabled underneath).
const stopTurnLabel = (voiceState: VoiceState): string => {
  if (voiceState === VOICE_STATES.LISTENING) return 'End your turn';
  if (voiceState === VOICE_STATES.SPEAKING) return 'Interrupt the reply';

  return 'Voice mode mic';
};

// Full-screen live conversation view, driven by useVoiceModeConversation.
export const VoiceModeOverlay = ({
  voiceState,
  errorMessage,
  partialTranscript,
  micLevel,
  onExit,
  onStopTurn,
}: VoiceModeOverlayProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const canStopTurn = voiceState === VOICE_STATES.LISTENING || voiceState === VOICE_STATES.SPEAKING;

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      end={{ x: 1, y: 0 }}
      start={{ x: 0.1, y: 1 }}
      style={[StyleSheet.absoluteFill, styles.container]}
    >
      <View style={styles.center}>
        <Waveform colors={colors} micLevel={micLevel} voiceState={voiceState} />
        <Text style={styles.transcriptText}>{partialTranscript || STATE_LABEL[voiceState]}</Text>
        {voiceState === VOICE_STATES.ERROR && errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}
      </View>

      <View style={[styles.controlsRow, { paddingBottom: insets.bottom + shellSpacing.md }]}>
        <Pressable
          accessibilityLabel="Switch to keyboard"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onExit}
          style={styles.sideButton}
        >
          <Keyboard color={colors.textOnDark} size={20} />
        </Pressable>
        <Pressable
          accessibilityLabel={stopTurnLabel(voiceState)}
          accessibilityRole="button"
          disabled={!canStopTurn}
          onPress={onStopTurn}
          style={[styles.micButton, !canStopTurn && styles.micButtonDisabled]}
        >
          <Mic color={colors.textOnDark} size={26} />
        </Pressable>
        <Pressable
          accessibilityLabel="Exit voice mode"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onExit}
          style={styles.sideButton}
        >
          <X color={colors.textOnDark} size={20} />
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      justifyContent: 'space-between',
    },
    center: {
      alignItems: 'center',
      flex: 1,
      gap: shellSpacing.lg,
      justifyContent: 'center',
      paddingHorizontal: shellSpacing.xl,
    },
    transcriptText: {
      color: colors.textOnDark,
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 30,
      textAlign: 'center',
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    controlsRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.xl,
      justifyContent: 'center',
      paddingTop: shellSpacing.lg,
    },
    sideButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    micButton: {
      alignItems: 'center',
      backgroundColor: colors.accentGradientEnd,
      borderRadius: 40,
      height: 80,
      justifyContent: 'center',
      width: 80,
    },
    micButtonDisabled: {
      opacity: 0.4,
    },
  });
