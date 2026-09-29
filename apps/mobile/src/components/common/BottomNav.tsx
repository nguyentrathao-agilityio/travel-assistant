import { LinearGradient } from 'expo-linear-gradient';
import { AudioLines, BotMessageSquare, House } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Utils
import { shellOpacity, shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';
import type { LucideIcon } from 'lucide-react-native';

export type BottomNavTab = 'home' | 'voice' | 'chat';

interface BottomNavProps {
  activeTab: BottomNavTab;
  isChatDisabled?: boolean;
  onAskByVoice: () => void;
  onGoHome: () => void;
  onStartNewChat: () => void;
}

/** Floating pill nav shared by Dashboard and All trips — the active tab renders as a gradient pill. */
export const BottomNav = ({
  activeTab,
  isChatDisabled = false,
  onAskByVoice,
  onGoHome,
  onStartNewChat,
}: BottomNavProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderTab = (
    tab: BottomNavTab,
    Icon: LucideIcon,
    label: string,
    onPress: () => void,
    disabled = false
  ) => {
    if (tab === activeTab) {
      return (
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="button"
          disabled={disabled}
          onPress={onPress}
          style={disabled && styles.bottomNavButtonDisabled}
        >
          <LinearGradient
            colors={[colors.accentGradientStart, colors.accentGradientEnd]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.bottomNavActive}
          >
            <Icon color={colors.textOnDark} size={20} strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[styles.bottomNavButton, disabled && styles.bottomNavButtonDisabled]}
      >
        <Icon color={colors.textOnDarkMuted} size={20} strokeWidth={2.2} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.bottomNav, { bottom: Math.max(insets.bottom, shellSpacing.md) }]}>
      {renderTab('home', House, 'Home', onGoHome)}
      {renderTab('voice', AudioLines, 'Open voice assistant', onAskByVoice)}
      {renderTab('chat', BotMessageSquare, 'Start new chat', onStartNewChat, isChatDisabled)}
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    bottomNav: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#21132f',
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
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
      opacity: shellOpacity.disabledSoft,
    },
  });
