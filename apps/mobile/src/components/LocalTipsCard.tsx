import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Constants
import { TIP_CATEGORY_LABELS } from '@repo/constants';

// Components
import { Card, EmptyState, Typography } from './common';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Types
import type { ShellColors } from '../theme';
import type { TipsResult } from '@repo/types';

interface LocalTipsCardProps {
  data: TipsResult;
}

export const LocalTipsCard = ({ data }: LocalTipsCardProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Typography style={styles.title} variant="title" weight="medium">
          💡 Local tips{data.city ? `: ${data.city}` : ''}
        </Typography>
        <Typography color="muted" variant="meta">
          {data.count} tip{data.count !== 1 ? 's' : ''}
        </Typography>
      </View>
      {data.summary && (
        <Typography color="muted" variant="meta">
          {data.summary}
        </Typography>
      )}

      {data.tips.length ? (
        <View style={styles.list}>
          {data.tips.map((tip) => (
            <View key={tip.id} style={styles.tipRow}>
              <View style={styles.tipHeaderRow}>
                <Typography style={styles.tipTitle} weight="medium">
                  {tip.title}
                </Typography>
                <View style={styles.badgeGroup}>
                  {tip.isEssential && (
                    <View style={styles.essentialBadge}>
                      <Typography variant="label">⭐ Essential</Typography>
                    </View>
                  )}
                  <View style={styles.categoryBadge}>
                    <Typography variant="label">{TIP_CATEGORY_LABELS[tip.category]}</Typography>
                  </View>
                </View>
              </View>
              <Typography color="muted" variant="meta">
                {tip.content}
              </Typography>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState message="No local tips were available for this destination." />
      )}
    </Card>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    card: {
      gap: shellSpacing.sm,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
      justifyContent: 'space-between',
    },
    title: {
      flex: 1,
    },
    list: {
      gap: shellSpacing.md,
    },
    tipRow: {
      borderColor: colors.surfaceBorder,
      borderTopWidth: 1,
      gap: shellSpacing.xs,
      paddingTop: shellSpacing.sm,
    },
    tipHeaderRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: shellSpacing.sm,
      justifyContent: 'space-between',
    },
    tipTitle: {
      flex: 1,
    },
    badgeGroup: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: shellSpacing.xs,
      justifyContent: 'flex-end',
    },
    essentialBadge: {
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.xs,
      paddingVertical: 2,
    },
    categoryBadge: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.xs,
      paddingVertical: 2,
    },
  });
