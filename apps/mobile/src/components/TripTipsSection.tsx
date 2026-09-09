import { StyleSheet, View } from 'react-native';

// Types
import type { TipsResult } from '@repo/types';

// Constants
import { TIP_CATEGORY_LABELS } from '@repo/constants';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';

// Components
import { Typography } from './common';

interface TripTipsSectionProps {
  tips: TipsResult;
}

const MAX_TIPS = 4;

export const TripTipsSection = ({ tips }: TripTipsSectionProps) => {
  if (!tips.tips.length) return null;

  const essentialTips = tips.tips.filter((tip) => tip.isEssential).slice(0, MAX_TIPS);
  const displayTips = essentialTips.length ? essentialTips : tips.tips.slice(0, MAX_TIPS);

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

const styles = StyleSheet.create({
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
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
});
