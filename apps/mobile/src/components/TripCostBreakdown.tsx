import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Types
import type { TripCostEstimate } from '@repo/schemas';

// Constants
import { COST_ICON_MAP, DEFAULT_COST_ICON } from '../constants';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { formatAmount } from '@repo/utils';

// Components
import { Typography } from './common';

import type { ShellColors } from '../theme';

interface TripCostBreakdownProps {
  estimate: TripCostEstimate;
}

const getCostIcon = (label: string): string => {
  const lower = label.toLowerCase();

  return (
    COST_ICON_MAP.find(({ keywords }) => keywords.some((k) => lower.includes(k)))?.icon ??
    DEFAULT_COST_ICON
  );
};

export const TripCostBreakdown = ({ estimate }: TripCostBreakdownProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
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
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      gap: shellSpacing.sm,
    },
    card: {
      backgroundColor: colors.pillBackground,
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
      backgroundColor: colors.surfaceBorder,
      height: 1,
      marginVertical: shellSpacing.xs,
    },
    totalRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
