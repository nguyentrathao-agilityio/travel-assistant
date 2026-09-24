import { LinearGradient } from 'expo-linear-gradient';
import { AudioLines, History, MessageCircleMore } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { BOTTOM_NAV_CLEARANCE, GRID_ROW_HEIGHT } from '../constants';

// Components
import {
  BottomNav,
  GridActionCard,
  PrimaryActionCard,
  RecentThreadsSection,
  ThemeToggleButton,
} from '../components';

// Utils
import { shellSpacing, useShellTheme } from '../theme';

// Types
import type { ThreadListStatus } from '../constants';
import type { ThreadItem } from '../services';
import type { ShellColors } from '../theme';

interface DashboardScreenProps {
  recentThreadsStatus: ThreadListStatus;
  recentThreadsSyncFailed: boolean;
  recentThreads: ThreadItem[];
  continueThreadId: string | null;
  isStartingTrip: boolean;
  onStartNewTrip: () => void;
  onOpenThread: (threadId: string) => void;
  onAskByVoice: () => void;
  onSeeAll: () => void;
  onRetryRecentThreads: () => void;
}

export const DashboardScreen = ({
  recentThreadsStatus,
  recentThreadsSyncFailed,
  recentThreads,
  continueThreadId,
  isStartingTrip,
  onStartNewTrip,
  onOpenThread,
  onAskByVoice,
  onSeeAll,
  onRetryRecentThreads,
}: DashboardScreenProps) => {
  const continueTripThreadId = continueThreadId ?? recentThreads[0]?.id;
  const insets = useSafeAreaInsets();
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      end={{ x: 1, y: 0 }}
      start={{ x: 0.15, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + BOTTOM_NAV_CLEARANCE,
            paddingTop: insets.top + shellSpacing.lg,
          },
        ]}
      >
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingHello}>Hello,</Text>
            <Text style={styles.greetingName}>Alex Traveler</Text>
          </View>
          <ThemeToggleButton />
        </View>

        <View style={styles.grid}>
          <PrimaryActionCard
            buttonLabel="Let’s Talk"
            description="Find answers using your voice…"
            icon={AudioLines}
            onPress={onAskByVoice}
            style={styles.gridLeft}
          />
          <View style={styles.gridRight}>
            <GridActionCard
              disabled={isStartingTrip}
              icon={MessageCircleMore}
              label="Start new chat"
              onPress={onStartNewTrip}
              style={styles.gridRightItem}
            />
            {continueTripThreadId && (
              <GridActionCard
                icon={History}
                label="Continue last trip"
                onPress={() => onOpenThread(continueTripThreadId)}
                style={styles.gridRightItem}
              />
            )}
          </View>
        </View>

        <RecentThreadsSection
          onOpenThread={onOpenThread}
          onRetry={onRetryRecentThreads}
          onSeeAll={onSeeAll}
          status={recentThreadsStatus}
          syncFailed={recentThreadsSyncFailed}
          threads={recentThreads}
        />
      </ScrollView>

      <BottomNav
        activeTab="home"
        isChatDisabled={isStartingTrip}
        onAskByVoice={onAskByVoice}
        onGoHome={() => {}}
        onStartNewChat={onStartNewTrip}
      />
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: shellSpacing.xl,
      paddingHorizontal: shellSpacing.lg,
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
      fontSize: 26,
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
  });
