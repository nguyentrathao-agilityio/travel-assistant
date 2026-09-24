import { Pencil, Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { shellRadii, shellSpacing, useShellTheme } from '../../theme';
import { getRecentIcon, threadLabel } from '../../utils/thread';
import { IconBadge } from '../IconBadge';

import type { ThreadItem } from '../../services';
import type { ShellColors } from '../../theme';

interface TripRowProps {
  deleting: boolean;
  index: number;
  onDelete: (thread: ThreadItem) => void;
  onOpen: (threadId: string) => void;
  onRename: (thread: ThreadItem) => void;
  thread: ThreadItem;
}

const threadTime = (thread: ThreadItem): string =>
  new Date(thread.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const TripRow = ({ deleting, index, onDelete, onOpen, onRename, thread }: TripRowProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" onPress={() => onOpen(thread.id)} style={styles.main}>
        <IconBadge icon={getRecentIcon(index)} size={40} />
        <View style={styles.textGroup}>
          <Text numberOfLines={1} style={styles.title}>
            {threadLabel(thread)}
          </Text>
          <Text style={styles.time}>{threadTime(thread)}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Rename trip"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onRename(thread)}
        style={styles.actionButton}
      >
        <Pencil color={colors.textOnDarkMuted} size={18} />
      </Pressable>
      <Pressable
        accessibilityLabel="Delete trip"
        accessibilityRole="button"
        disabled={deleting}
        hitSlop={8}
        onPress={() => onDelete(thread)}
        style={[styles.actionButton, deleting && styles.busy]}
      >
        <Trash2 color={colors.textOnDarkMuted} size={18} />
      </Pressable>
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.row,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: shellSpacing.sm,
      paddingRight: shellSpacing.sm,
    },
    main: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    textGroup: { flex: 1, gap: 2 },
    title: { color: colors.textOnDark, fontSize: 15, fontWeight: '600' },
    time: { color: colors.textOnDarkMuted, fontSize: 12 },
    actionButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
    busy: { opacity: 0.4 },
  });
