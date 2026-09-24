import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HeaderBackButton, ThemeToggleButton } from '../common';
import { shellSpacing, useShellTheme } from '../../theme';

import type { ShellColors } from '../../theme';

export const ChatHeader = ({ onBack }: { onBack: () => void }) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <HeaderBackButton onPress={onBack} />
      <View style={styles.titleWrap}>
        <Sparkles color={colors.textOnDark} size={18} strokeWidth={2.2} />
        <Text style={styles.title}>AI Travel</Text>
      </View>
      <View style={styles.spacer} />
      <ThemeToggleButton />
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
    },
    titleWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
    title: {
      color: colors.textOnDark,
      fontSize: 18,
      fontWeight: '700',
    },
    spacer: {
      flex: 1,
    },
  });
