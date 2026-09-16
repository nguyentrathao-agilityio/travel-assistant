import { LinearGradient } from 'expo-linear-gradient';
import { Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

// Constants
import { RECENT_ICONS } from '../constants';

// Components
import { EmptyState, ErrorState, IconBadge, LoadingState } from '../components';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Types
import type { ThreadItem } from '../services';
import type { ShellColors } from '../theme';

interface AllTripsScreenProps {
  status: 'loading' | 'ready' | 'error';
  threads: ThreadItem[];
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreFailed: boolean;
  deletingThreadId: string | null;
  onOpenThread: (threadId: string) => void;
  onDeleteThread: (thread: ThreadItem) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

const threadLabel = (thread: ThreadItem): string => thread.title ?? 'Untitled trip';

export const AllTripsScreen = ({
  status,
  threads,
  isLoadingMore,
  hasMore,
  loadMoreFailed,
  deletingThreadId,
  onOpenThread,
  onDeleteThread,
  onLoadMore,
  onRetry,
}: AllTripsScreenProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      {status === 'loading' && (
        <View style={styles.list}>
          <LoadingState />
        </View>
      )}
      {status === 'error' && (
        <View style={styles.list}>
          <ErrorState message="Couldn't load your trips." onRetry={onRetry} />
        </View>
      )}
      {status === 'ready' && threads.length === 0 && (
        <EmptyState icon="🧳" message="Your trips will show up here." />
      )}

      {status === 'ready' && threads.length > 0 && (
        <FlatList
          contentContainerStyle={styles.list}
          data={threads}
          keyExtractor={(thread) => thread.id}
          ListFooterComponent={
            <View style={styles.footer}>
              {isLoadingMore && <ActivityIndicator color={colors.textOnDarkMuted} />}
              {loadMoreFailed && (
                <ErrorState message="Couldn't load more trips." onRetry={onLoadMore} />
              )}
            </View>
          }
          onEndReached={hasMore && !loadMoreFailed ? onLoadMore : undefined}
          onEndReachedThreshold={0.5}
          renderItem={({ item: thread, index }) => (
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenThread(thread.id)}
                style={styles.rowMain}
              >
                <IconBadge icon={RECENT_ICONS[index % RECENT_ICONS.length]} size={32} />
                <Text numberOfLines={1} style={styles.rowText}>
                  {threadLabel(thread)}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Delete trip"
                accessibilityRole="button"
                disabled={deletingThreadId === thread.id}
                hitSlop={8}
                onPress={() => onDeleteThread(thread)}
                style={[
                  styles.deleteButton,
                  deletingThreadId === thread.id && styles.deleteButtonBusy,
                ]}
              >
                <Trash2 color={colors.danger} size={19} />
              </Pressable>
            </View>
          )}
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
    list: {
      padding: shellSpacing.lg,
    },
    footer: {
      gap: shellSpacing.sm,
      paddingVertical: shellSpacing.md,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
      marginBottom: shellSpacing.sm,
    },
    rowMain: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.row,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    rowText: {
      color: colors.textOnDarkMuted,
      flex: 1,
      fontSize: 13,
    },
    chevron: {
      color: colors.textOnDarkMuted,
      fontSize: 20,
      fontWeight: '300',
    },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: 'rgba(248, 113, 113, 0.14)',
      borderRadius: 22,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    deleteButtonBusy: {
      opacity: 0.4,
    },
  });
