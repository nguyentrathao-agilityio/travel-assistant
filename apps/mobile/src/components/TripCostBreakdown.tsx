import { StyleSheet, View } from 'react-native';

// Types
import type { TripCostEstimate } from '@repo/schemas';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatAmount } from '@repo/utils';

// Components
import { Typography } from './common';

interface TripCostBreakdownProps {
  estimate: TripCostEstimate;
}

const COST_ICON_MAP: { keywords: string[]; icon: string }[] = [
  { keywords: ['flight', 'air'], icon: '✈️' },
  { keywords: ['hotel', 'accommodation', 'stay', 'room'], icon: '🏨' },
  { keywords: ['food', 'meal', 'dining', 'restaurant'], icon: '🍜' },
  { keywords: ['activity', 'activities', 'tour', 'sightseeing'], icon: '🎯' },
];

const getCostIcon = (label: string): string => {
  const lower = label.toLowerCase();

  return (
    COST_ICON_MAP.find(({ keywords }) => keywords.some((k) => lower.includes(k)))?.icon ?? '🏷️'
  );
};

export const TripCostBreakdown = ({ estimate }: TripCostBreakdownProps) => (
  <View style={styles.container}>
    <Typography color="faint" variant="label" weight="semibold">
      💰 ESTIMATED TOTAL
    </Typography>

    <View style={styles.card}>
      {estimate.breakdown.map((item) => (
        <View key={item.label} style={styles.row}>
          <Typography>{getCostIcon(item.label)}</Typography>
          <View style={styles.rowContent}>
            <Typography variant="meta">{item.label}</Typography>
            {item.note && (
              <Typography color="faint" variant="label">
                {item.note}
              </Typography>
            )}
          </View>
          <Typography variant="meta" weight="medium">
            {item.amount === 0 ? '—' : `~${formatAmount(item.amount, item.currency)}`}
          </Typography>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <View>
          <Typography weight="medium">Grand total</Typography>
          <Typography color="faint" variant="label">
            {estimate.days} night{estimate.days !== 1 ? 's' : ''} · {estimate.travelers} traveler
            {estimate.travelers !== 1 ? 's' : ''}
          </Typography>
        </View>
        <Typography variant="title" weight="medium">
          ~{formatAmount(estimate.grandTotal, estimate.currency)}
        </Typography>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: shellSpacing.sm,
  },
  card: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.button,
    padding: shellSpacing.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: shellSpacing.sm,
    paddingVertical: shellSpacing.xs,
  },
  rowContent: {
    flex: 1,
    gap: 1,
  },
  divider: {
    backgroundColor: shellColors.surfaceBorder,
    height: 1,
    marginVertical: shellSpacing.xs,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
