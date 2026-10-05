import { Play, Square, Volume2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { shellSpacing, useShellTheme } from '../../theme';
import { formatClipDuration } from '../../utils/voice';

import type { ShellColors } from '../../theme';

interface PlaybackButtonProps {
  /** Recording length; when set the button replays a recording (▶ + duration), otherwise it reads the reply aloud (🔊). */
  durationMs?: number;
  isLoading: boolean;
  isPlaying: boolean;
  onPress: () => void;
  testID: string;
}

const ICON_SIZE = 18;
const BUTTON_SIZE = 28;

/** Replay toggle shown in the bottom-right corner of a chat bubble. */
export const PlaybackButton = ({
  durationMs,
  isLoading,
  isPlaying,
  onPress,
  testID,
}: PlaybackButtonProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isRecording = durationMs !== undefined;
  const label = isRecording ? 'your recording' : 'reply';
  const IdleIcon = isRecording ? Play : Volume2;
  const Icon = isPlaying ? Square : IdleIcon;

  return (
    <Pressable
      accessibilityLabel={isPlaying ? `Stop ${label}` : `Play ${label}`}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading }}
      hitSlop={shellSpacing.sm}
      onPress={onPress}
      style={styles.button}
      testID={testID}
    >
      {isLoading ? (
        <ActivityIndicator
          color={colors.textOnDarkMuted}
          size="small"
          testID={`${testID}-loading`}
        />
      ) : (
        <Icon color={colors.textOnDarkMuted} size={ICON_SIZE} />
      )}
      {isRecording ? <Text style={styles.duration}>{formatClipDuration(durationMs)}</Text> : null}
    </Pressable>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      alignSelf: 'flex-end',
      flexDirection: 'row',
      gap: shellSpacing.xs,
      height: BUTTON_SIZE,
      justifyContent: 'center',
      minWidth: BUTTON_SIZE,
    },
    duration: {
      color: colors.textOnDarkMuted,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
    },
  });
