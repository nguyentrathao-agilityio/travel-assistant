import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Constants
import { TIP_CATEGORY_LABELS } from '@repo/constants';
import { MAX_TRIP_TIPS } from '../constants';

// Components
import { Typography } from './common';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Types
import type { ShellColors } from '../theme';
import type { TipsResult } from '@repo/types';

interface TripTipsSectionProps {
  tips: TipsResult;
}

export const TripTipsSection = ({ tips }: TripTipsSectionProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!tips.tips.length) return null;

  const essentialTips = tips.tips.filter((tip) => tip.isEssential).slice(0, MAX_TRIP_TIPS);
  const displayTips = essentialTips.length ? essentialTips : tips.tips.slice(0, MAX_TRIP_TIPS);

  return (
    <View style={styles.container}>
      <Typography color="faint" variant="label" weight="semibold">
        LOCAL TIPS
      </Typography>

      {displayTips.map((tip) => (
        <View key={tip.id} style={styles.row}>
          <Typography>💡</Typography>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Typography style={styles.title} weight="medium">
                {tip.title}
              </Typography>
              <View style={styles.badge}>
                <Typography variant="label">{TIP_CATEGORY_LABELS[tip.category]}</Typography>
              </View>
            </View>
            <Typography color="muted" variant="meta">
              {tip.content}
            </Typography>
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      gap: shellSpacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
    content: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: shellSpacing.sm,
      justifyContent: 'space-between',
    },
    title: {
      flex: 1,
    },
    badge: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.xs,
      paddingVertical: 2,
    },
  });
