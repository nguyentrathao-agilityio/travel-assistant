import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { GRID_ROW_HEIGHT, RECENT_ICONS } from '../constants';

// Components
import { GridActionCard, IconBadge, PrimaryActionCard, ThemeToggleButton } from '../components';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Types
import type { ThreadItem } from '../services';
import type { ShellColors } from '../theme';

interface DashboardScreenProps {
  recentThreadsStatus: 'loading' | 'ready' | 'error';
  recentThreads: ThreadItem[];
  continueThreadId: string | null;
  onStartNewTrip: () => void;
  onOpenThread: (threadId: string) => void;
  onAskByVoice: () => void;
  onSeeAll: () => void;
}

const threadLabel = (thread: ThreadItem): string => thread.title ?? 'Untitled trip';

export const DashboardScreen = ({
  recentThreadsStatus,
  recentThreads,
  continueThreadId,
  onStartNewTrip,
  onOpenThread,
  onAskByVoice,
  onSeeAll,
}: DashboardScreenProps) => {
  const continueTripThreadId = continueThreadId ?? recentThreads[0]?.id;
  const insets = useSafeAreaInsets();
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + shellSpacing.lg }]}
      >
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingHello}>Hello,</Text>
            <Text style={styles.greetingName}>Traveler</Text>
          </View>
          <ThemeToggleButton />
        </View>

        <View style={styles.grid}>
          <PrimaryActionCard
            buttonLabel="Get started"
            description="Begin planning a brand-new itinerary"
            icon="🧳"
            onPress={onStartNewTrip}
            style={styles.gridLeft}
            title="Start new trip"
          />
          <View style={styles.gridRight}>
            <GridActionCard
              icon="🎙️"
              label="Ask by voice"
              onPress={onAskByVoice}
              style={styles.gridRightItem}
            />
            {continueTripThreadId && (
              <GridActionCard
                icon="🔄"
                label="Continue last trip"
                onPress={() => onOpenThread(continueTripThreadId)}
                style={styles.gridRightItem}
              />
            )}
          </View>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent trips</Text>
          <Pressable accessibilityRole="button" onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {recentThreadsStatus === 'loading' && (
          <Text style={styles.recentEmpty}>Loading your trips…</Text>
        )}
        {recentThreadsStatus === 'error' && (
          <Text style={styles.recentEmpty}>Couldn&apos;t load recent trips.</Text>
        )}
        {recentThreadsStatus === 'ready' && recentThreads.length === 0 && (
          <Text style={styles.recentEmpty}>Your trips will show up here.</Text>
        )}
        {recentThreadsStatus === 'ready' &&
          recentThreads.map((thread, index) => (
            <Pressable
              accessibilityRole="button"
              key={thread.id}
              onPress={() => onOpenThread(thread.id)}
              style={styles.recentRow}
            >
              <IconBadge icon={RECENT_ICONS[index % RECENT_ICONS.length]} size={32} />
              <Text numberOfLines={1} style={styles.recentItemText}>
                {threadLabel(thread)}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
      </ScrollView>
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: shellSpacing.lg,
    },
    greetingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: shellSpacing.lg,
    },
    greetingHello: {
      color: colors.textOnDarkMuted,
      fontSize: 15,
    },
    greetingName: {
      color: colors.textOnDark,
      fontSize: 24,
      fontWeight: '700',
    },
    grid: {
      flexDirection: 'row',
      gap: shellSpacing.md,
      height: GRID_ROW_HEIGHT,
      marginBottom: shellSpacing.lg,
    },
    gridLeft: {
      flex: 1,
    },
    gridRight: {
      flex: 1,
      gap: shellSpacing.md,
    },
    gridRightItem: {
      flex: 1,
    },
    recentHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: shellSpacing.sm,
    },
    recentTitle: {
      color: colors.textOnDark,
      fontSize: 16,
      fontWeight: '600',
    },
    seeAll: {
      color: colors.textOnDarkFaint,
      fontSize: 13,
    },
    recentEmpty: {
      color: colors.textOnDarkMuted,
      fontSize: 13,
    },
    recentRow: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.row,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      marginBottom: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    recentItemText: {
      color: colors.textOnDarkMuted,
      flex: 1,
      fontSize: 13,
    },
    chevron: {
      color: colors.textOnDarkMuted,
      fontSize: 20,
      fontWeight: '300',
    },
  });
