import { useCallback, useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';

// Constants
import { LIST_PAGINATION_THRESHOLD, THREAD_LIST_STATUS } from '../../constants';

// Components
import { EmptyState, ErrorState, LoadingState } from '../common';
import { TripRow } from './TripRow';

// Utils
import { shellSpacing, useShellTheme } from '../../theme';
import { groupThreadsByDate } from '../../utils/groupThreadsByDate';

// Types
import type { ThreadListStatus } from '../../constants';
import type { ThreadItem } from '../../services';
import type { ShellColors } from '../../theme';
import type { ScrollViewProps } from 'react-native';

export interface AllTripsListProps {
  status: ThreadListStatus;
  threads: ThreadItem[];
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreFailed: boolean;
  syncFailed: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

interface TripsListProps extends AllTripsListProps {
  deletingThreadId: string | null;
  filteredThreads: ThreadItem[];
  isSearching: boolean;
  listBottomClearance: number;
  onDeleteThread: (thread: ThreadItem) => void;
  onOpenThread: (threadId: string) => void;
  onStartRename: (thread: ThreadItem) => void;
}

export const TripsList = ({
  deletingThreadId,
  filteredThreads,
  hasMore,
  isLoadingMore,
  isSearching,
  listBottomClearance,
  loadMoreFailed,
  onDeleteThread,
  onLoadMore,
  onOpenThread,
  onRetry,
  onStartRename,
  status,
  syncFailed,
  threads,
}: TripsListProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sections = useMemo(() => groupThreadsByDate(filteredThreads), [filteredThreads]);
  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <KeyboardChatScrollView
        {...props}
        keyboardDismissMode="on-drag"
        keyboardLiftBehavior="never"
        keyboardShouldPersistTaps="handled"
        offset={listBottomClearance}
      />
    ),
    [listBottomClearance]
  );

  if (status === THREAD_LIST_STATUS.LOADING) {
    return (
      <View style={styles.list}>
        <LoadingState />
      </View>
    );
  }
  if (status === THREAD_LIST_STATUS.ERROR) {
    return (
      <View style={styles.list}>
        <ErrorState message="Couldn't load your trips." onRetry={onRetry} />
      </View>
    );
  }

  return (
    <>
      {syncFailed && (
        <View style={styles.syncError}>
          <ErrorState message="Couldn't refresh your trips." onRetry={onRetry} />
        </View>
      )}
      {threads.length === 0 && <EmptyState icon="🧳" message="Your trips will show up here." />}
      {threads.length > 0 && isSearching && filteredThreads.length === 0 && (
        <EmptyState icon="🔍" message="No trips match your search." />
      )}
      {filteredThreads.length > 0 && (
        <SectionList
          contentContainerStyle={[styles.list, { paddingBottom: listBottomClearance }]}
          keyExtractor={(thread) => thread.id}
          ListFooterComponent={
            <View style={styles.footer}>
              {isLoadingMore && <ActivityIndicator color={colors.textOnDarkMuted} />}
              {loadMoreFailed && (
                <ErrorState message="Couldn't load more trips." onRetry={onLoadMore} />
              )}
            </View>
          }
          onEndReached={!isSearching && hasMore && !loadMoreFailed ? onLoadMore : undefined}
          onEndReachedThreshold={LIST_PAGINATION_THRESHOLD}
          renderItem={({ item, index }) => (
            <TripRow
              deleting={deletingThreadId === item.id}
              index={index}
              onDelete={onDeleteThread}
              onOpen={onOpenThread}
              onRename={onStartRename}
              thread={item}
            />
          )}
          renderScrollComponent={renderScrollComponent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>
          )}
          sections={sections}
        />
      )}
    </>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    list: { padding: shellSpacing.lg },
    syncError: { paddingHorizontal: shellSpacing.lg, paddingTop: shellSpacing.md },
    footer: { gap: shellSpacing.sm, paddingVertical: shellSpacing.md },
    sectionHeader: {
      color: colors.textOnDarkMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: shellSpacing.sm,
      marginTop: shellSpacing.md,
    },
  });
