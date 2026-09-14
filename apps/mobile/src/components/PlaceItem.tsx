import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Types
import type { Place } from '@repo/types';

// Constants
import {
  PLACE_CATEGORY_LABELS,
  PLACE_PRICE_LABEL_FALLBACK,
  PLACE_PRICE_LABELS,
} from '@repo/constants';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Components
import { Typography } from './common';

import type { ShellColors } from '../theme';

interface PlaceItemProps {
  place: Place;
}

export const PlaceItem = ({ place }: PlaceItemProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {place.imageUrl && (
        <Image resizeMode="cover" source={{ uri: place.imageUrl }} style={styles.thumbnail} />
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Typography style={styles.title} weight="medium">
            {place.name}
          </Typography>
          <View style={styles.badgeGroup}>
            {place.isRecommended && <Typography>⭐</Typography>}
            <View style={styles.categoryBadge}>
              <Typography variant="label">{PLACE_CATEGORY_LABELS[place.category]}</Typography>
            </View>
          </View>
        </View>

        {place.description && (
          <Typography color="muted" numberOfLines={2} style={styles.description} variant="meta">
            {place.description}
          </Typography>
        )}

        <View style={styles.metaRow}>
          <Typography color="faint" variant="meta">
            ⭐ {place.rating.toFixed(1)} ({place.reviewCount.toLocaleString()})
          </Typography>
          <Typography color="faint" variant="meta">
            🎫 {PLACE_PRICE_LABELS[place.priceLevel] ?? PLACE_PRICE_LABEL_FALLBACK}
          </Typography>
          {place.openingHours && (
            <Typography color="faint" variant="meta">
              🕒 {place.openingHours}
            </Typography>
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      overflow: 'hidden',
    },
    thumbnail: {
      height: 168,
      width: '100%',
    },
    content: {
      gap: shellSpacing.xs,
      padding: shellSpacing.sm,
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
    badgeGroup: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
    categoryBadge: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.xs,
      paddingVertical: 2,
    },
    description: {
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: shellSpacing.md,
    },
  });
