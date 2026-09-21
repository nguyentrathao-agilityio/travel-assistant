import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  AudioLines,
  BotMessageSquare,
  House,
  Search,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
} from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { ALL_TRIPS_BOTTOM_NAV_CLEARANCE, RECENT_ICONS, THREAD_LIST_STATUS } from '../constants';

// Components
import { EmptyState, ErrorState, IconBadge, LoadingState, ThemeToggleButton } from '../components';

// Hooks
import { useDebouncedValue } from '../hooks';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { groupThreadsByDate } from '../utils/groupThreadsByDate';

// Types
import type { ThreadListStatus } from '../constants';
import type { ThreadItem } from '../services';
import type { ShellColors } from '../theme';

interface AllTripsScreenProps {
  status: ThreadListStatus;
  threads: ThreadItem[];
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreFailed: boolean;
  deletingThreadId: string | null;
  isStartingTrip: boolean;
  isDeletingAll: boolean;
  onOpenThread: (threadId: string) => void;
  onDeleteThread: (thread: ThreadItem) => void;
  onDeleteAllTrips: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onGoHome: () => void;
  onAskByVoice: () => void;
  onStartNewTrip: () => void;
  onBack: () => void;
}

const threadLabel = (thread: ThreadItem): string => thread.title ?? 'Untitled trip';

const threadTime = (thread: ThreadItem): string =>
  new Date(thread.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const AllTripsScreen = ({
  status,
  threads,
  isLoadingMore,
  hasMore,
  loadMoreFailed,
  deletingThreadId,
  isStartingTrip,
  isDeletingAll,
  onOpenThread,
  onDeleteThread,
  onDeleteAllTrips,
  onLoadMore,
  onRetry,
  onGoHome,
  onAskByVoice,
  onStartNewTrip,
  onBack,
}: AllTripsScreenProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const listBottomClearance = insets.bottom + ALL_TRIPS_BOTTOM_NAV_CLEARANCE;

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

  const filteredThreads = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();

    if (!query) return threads;

    return threads.filter((thread) => threadLabel(thread).toLowerCase().includes(query));
  }, [threads, debouncedQuery]);

  const sections = useMemo(() => groupThreadsByDate(filteredThreads), [filteredThreads]);
  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.headerRow, { paddingTop: insets.top + shellSpacing.md }]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={styles.headerBackButton}
        >
          <ArrowLeft color={colors.textOnDark} size={22} />
        </Pressable>
        <Text style={styles.headerTitleText}>All trips</Text>
        <View style={styles.headerSpacer} />
        <Pressable
          accessibilityLabel="Delete all trips"
          accessibilityRole="button"
          disabled={isDeletingAll}
          hitSlop={8}
          onPress={onDeleteAllTrips}
          style={[styles.headerDeleteAllButton, isDeletingAll && styles.headerButtonDisabled]}
        >
          <Trash2 color={colors.textOnDark} size={18} />
        </Pressable>
        <ThemeToggleButton />
      </View>

      <View style={styles.searchBar}>
        <Search color={colors.textOnDarkMuted} size={18} />
        <TextInput
          onBlur={() => setIsSearchFocused(false)}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Search your trips"
          placeholderTextColor={colors.textOnDarkMuted}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
        />
      </View>

      {status === THREAD_LIST_STATUS.LOADING && (
        <View style={styles.list}>
          <LoadingState />
        </View>
      )}
      {status === THREAD_LIST_STATUS.ERROR && (
        <View style={styles.list}>
          <ErrorState message="Couldn't load your trips." onRetry={onRetry} />
        </View>
      )}
      {status === THREAD_LIST_STATUS.READY && threads.length === 0 && (
        <EmptyState icon="🧳" message="Your trips will show up here." />
      )}
      {status === THREAD_LIST_STATUS.READY &&
        threads.length > 0 &&
        isSearching &&
        filteredThreads.length === 0 && (
          <EmptyState icon="🔍" message="No trips match your search." />
        )}

      {status === THREAD_LIST_STATUS.READY && filteredThreads.length > 0 && (
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
          onEndReachedThreshold={0.5}
          renderItem={({ item: thread, index }) => (
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenThread(thread.id)}
                style={styles.rowMain}
              >
                <IconBadge icon={RECENT_ICONS[index % RECENT_ICONS.length]} size={40} />
                <View style={styles.rowTextGroup}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {threadLabel(thread)}
                  </Text>
                  <Text style={styles.rowTime}>{threadTime(thread)}</Text>
                </View>
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
                <Trash2 color={colors.textOnDarkMuted} size={18} />
              </Pressable>
            </View>
          )}
          renderScrollComponent={renderScrollComponent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>
          )}
          sections={sections}
        />
      )}

      {!isSearchFocused && (
        <View style={[styles.bottomNav, { bottom: Math.max(insets.bottom, shellSpacing.md) }]}>
          <Pressable
            accessibilityLabel="Home"
            accessibilityRole="button"
            onPress={onGoHome}
            style={styles.bottomNavButton}
          >
            <House color={colors.textOnDarkMuted} size={20} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityLabel="Open voice assistant"
            accessibilityRole="button"
            onPress={onAskByVoice}
            style={styles.bottomNavButton}
          >
            <AudioLines color={colors.textOnDarkMuted} size={20} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityLabel="Start new chat"
            accessibilityRole="button"
            disabled={isStartingTrip}
            onPress={onStartNewTrip}
            style={isStartingTrip && styles.bottomNavButtonDisabled}
          >
            <LinearGradient
              colors={[colors.accentGradientStart, colors.accentGradientEnd]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.bottomNavActive}
            >
              <BotMessageSquare color={colors.textOnDark} size={20} strokeWidth={2.2} />
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
      paddingBottom: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
    },
    headerBackButton: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    headerTitleText: {
      color: colors.textOnDark,
      fontSize: 18,
      fontWeight: '700',
    },
    headerSpacer: {
      flex: 1,
    },
    headerDeleteAllButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: shellRadii.pill,
      height: 36,
      justifyContent: 'center',
      marginRight: shellSpacing.xs,
      width: 36,
    },
    headerButtonDisabled: {
      opacity: 0.4,
    },
    searchBar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      marginHorizontal: shellSpacing.lg,
      marginTop: shellSpacing.lg,
      paddingHorizontal: shellSpacing.md,
      height: 48,
    },
    searchInput: {
      color: colors.textOnDark,
      flex: 1,
      fontSize: 15,
    },
    list: {
      padding: shellSpacing.lg,
    },
    footer: {
      gap: shellSpacing.sm,
      paddingVertical: shellSpacing.md,
    },
    sectionHeader: {
      color: colors.textOnDarkMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: shellSpacing.sm,
      marginTop: shellSpacing.md,
    },
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
    rowMain: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    rowTextGroup: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      color: colors.textOnDark,
      fontSize: 15,
      fontWeight: '600',
    },
    rowTime: {
      color: colors.textOnDarkMuted,
      fontSize: 12,
    },
    deleteButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    deleteButtonBusy: {
      opacity: 0.4,
    },
    bottomNav: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#21132f',
      borderColor: colors.surfaceBorder,
      borderRadius: 30,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      height: 60,
      justifyContent: 'space-between',
      padding: 4,
      position: 'absolute',
      width: 176,
    },
    bottomNavButton: {
      alignItems: 'center',
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    bottomNavActive: {
      alignItems: 'center',
      borderRadius: 26,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    bottomNavButtonDisabled: {
      opacity: 0.5,
    },
  });
