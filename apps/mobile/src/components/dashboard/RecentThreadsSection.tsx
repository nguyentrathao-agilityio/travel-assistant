import { ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { THREAD_LIST_STATUS } from '../../constants';
import { shellSpacing, useShellTheme } from '../../theme';
import { getRecentIcon, threadLabel } from '../../utils/thread';
import { EmptyState, ErrorState, LoadingState } from '../common';
import { IconBadge } from '../IconBadge';

import type { ThreadListStatus } from '../../constants';
import type { ThreadItem } from '../../services';
import type { ShellColors } from '../../theme';

interface RecentThreadsSectionProps {
  onOpenThread: (threadId: string) => void;
  onRetry: () => void;
  onSeeAll: () => void;
  status: ThreadListStatus;
  syncFailed: boolean;
  threads: ThreadItem[];
}

export const RecentThreadsSection = ({
  onOpenThread,
  onRetry,
  onSeeAll,
  status,
  syncFailed,
  threads,
}: RecentThreadsSectionProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Recent searches</Text>
        <Pressable accessibilityRole="button" onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      {status === THREAD_LIST_STATUS.LOADING && <LoadingState />}
      {status === THREAD_LIST_STATUS.ERROR && (
        <ErrorState message="Couldn't load recent trips." onRetry={onRetry} />
      )}
      {status === THREAD_LIST_STATUS.READY && syncFailed && (
        <ErrorState message="Couldn't refresh recent trips." onRetry={onRetry} />
      )}
      {status === THREAD_LIST_STATUS.READY && threads.length === 0 && (
        <EmptyState icon="🧳" message="Your trips will show up here." />
      )}
      {status === THREAD_LIST_STATUS.READY &&
        threads.map((thread, index) => (
          <Pressable
            accessibilityRole="button"
            key={thread.id}
            onPress={() => onOpenThread(thread.id)}
            style={styles.row}
          >
            <IconBadge icon={getRecentIcon(index)} size={40} />
            <Text numberOfLines={1} style={styles.itemText}>
              {threadLabel(thread)}
            </Text>
            <ArrowRight color={colors.textOnDarkMuted} size={18} />
          </Pressable>
        ))}
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: shellSpacing.md,
    },
    title: { color: colors.textOnDark, fontSize: 20, fontWeight: '600' },
    seeAll: { color: colors.textOnDarkFaint, fontSize: 15 },
    row: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      marginBottom: shellSpacing.sm,
      minHeight: 64,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    itemText: { color: colors.textOnDark, flex: 1, fontSize: 15 },
  });
