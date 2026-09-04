import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { shellColors, shellRadii, shellSpacing } from '../theme';
import { GridActionCard } from './GridActionCard';
import { IconBadge } from './IconBadge';
import { PrimaryActionCard } from './PrimaryActionCard';

import type { ThreadItem } from '../services';

interface DashboardScreenProps {
  recentThreadsStatus: 'loading' | 'ready' | 'error';
  recentThreads: ThreadItem[];
  onStartNewTrip: () => void;
  onOpenThread: (threadId: string) => void;
  onAskByVoice: () => void;
}

const GRID_ROW_HEIGHT = 232;

// Cycled per row so the recent-trips list doesn't repeat the same glyph for every item —
// mirrors the reference's mix of distinct icons per row.
const RECENT_ICONS = ['🧭', '💡', '🎧', '❤️', '🖼️'];

const threadLabel = (thread: ThreadItem): string => thread.title ?? 'Untitled trip';

export const DashboardScreen = ({
  recentThreadsStatus,
  recentThreads,
  onStartNewTrip,
  onOpenThread,
  onAskByVoice,
}: DashboardScreenProps) => {
  const mostRecentThread = recentThreads[0];

  return (
    <LinearGradient
      colors={[shellColors.backgroundGradientStart, shellColors.backgroundGradientEnd]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingHello}>Hello,</Text>
            <Text style={styles.greetingName}>Traveler</Text>
          </View>
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
            {mostRecentThread && (
              <GridActionCard
                icon="🔄"
                label="Continue last trip"
                onPress={() => onOpenThread(mostRecentThread.id)}
                style={styles.gridRightItem}
              />
            )}
          </View>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent trips</Text>
          <Text style={styles.seeAll}>See all</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: shellSpacing.lg,
    paddingTop: shellSpacing.xl * 2,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: shellSpacing.lg,
  },
  greetingHello: {
    color: shellColors.textOnDarkMuted,
    fontSize: 15,
  },
  greetingName: {
    color: shellColors.textOnDark,
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
    color: shellColors.textOnDark,
    fontSize: 16,
    fontWeight: '600',
  },
  seeAll: {
    color: shellColors.textOnDarkFaint,
    fontSize: 13,
  },
  recentEmpty: {
    color: shellColors.textOnDarkMuted,
    fontSize: 13,
  },
  recentRow: {
    alignItems: 'center',
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.row,
    borderWidth: 1,
    flexDirection: 'row',
    gap: shellSpacing.sm,
    marginBottom: shellSpacing.sm,
    paddingHorizontal: shellSpacing.md,
    paddingVertical: shellSpacing.sm + 2,
  },
  recentItemText: {
    color: shellColors.textOnDarkMuted,
    flex: 1,
    fontSize: 13,
  },
  chevron: {
    color: shellColors.textOnDarkMuted,
    fontSize: 20,
    fontWeight: '300',
  },
});
