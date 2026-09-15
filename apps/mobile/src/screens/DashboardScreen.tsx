import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  AudioLines,
  BotMessageSquare,
  History,
  House,
  MessageCircleMore,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { GRID_ROW_HEIGHT, RECENT_ICONS } from '../constants';

// Components
import { GridActionCard, IconBadge, PrimaryActionCard, ThemeToggleButton } from '../components';

// Utils
import { shellSpacing, useShellTheme } from '../theme';

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
      end={{ x: 1, y: 0 }}
      start={{ x: 0.15, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 104, paddingTop: insets.top + shellSpacing.lg },
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

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent searches</Text>
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
              <IconBadge icon={RECENT_ICONS[index % RECENT_ICONS.length]} size={40} />
              <Text numberOfLines={1} style={styles.recentItemText}>
                {threadLabel(thread)}
              </Text>
              <ArrowRight color={colors.textOnDarkMuted} size={18} />
            </Pressable>
          ))}
      </ScrollView>

      <View style={[styles.bottomNav, { bottom: Math.max(insets.bottom, shellSpacing.md) }]}>
        <LinearGradient
          accessibilityLabel="Home"
          colors={[colors.accentGradientStart, colors.accentGradientEnd]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.bottomNavActive}
        >
          <House color={colors.textOnDark} size={20} strokeWidth={2.2} />
        </LinearGradient>
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
          onPress={onStartNewTrip}
          style={styles.bottomNavButton}
        >
          <BotMessageSquare color={colors.textOnDarkMuted} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>
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
    recentHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: shellSpacing.md,
    },
    recentTitle: {
      color: colors.textOnDark,
      fontSize: 20,
      fontWeight: '600',
    },
    seeAll: {
      color: colors.textOnDarkFaint,
      fontSize: 15,
    },
    recentEmpty: {
      color: colors.textOnDarkMuted,
      fontSize: 13,
    },
    recentRow: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      marginBottom: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
      minHeight: 64,
      paddingVertical: shellSpacing.sm,
    },
    recentItemText: {
      color: colors.textOnDark,
      flex: 1,
      fontSize: 15,
    },
    bottomNav: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#21132f',
      borderColor: colors.surfaceBorder,
      borderRadius: 30,
      borderWidth: 1,
      flexDirection: 'row',
      height: 60,
      justifyContent: 'space-between',
      padding: 4,
      position: 'absolute',
      width: 176,
    },
    bottomNavActive: {
      alignItems: 'center',
      borderRadius: 26,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    bottomNavButton: {
      alignItems: 'center',
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
  });
