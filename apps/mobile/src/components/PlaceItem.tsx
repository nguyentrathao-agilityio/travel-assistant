import { Image, StyleSheet, View } from 'react-native';

import {
  PLACE_CATEGORY_LABELS,
  PLACE_PRICE_LABEL_FALLBACK,
  PLACE_PRICE_LABELS,
} from '../constants';
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { Typography } from './common';

import type { Place } from '@repo/types';

interface PlaceItemProps {
  place: Place;
}

export const PlaceItem = ({ place }: PlaceItemProps) => (
  <View style={styles.container}>
    {place.imageUrl && <Image source={{ uri: place.imageUrl }} style={styles.thumbnail} />}

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

const styles = StyleSheet.create({
  container: {
    borderColor: shellColors.surfaceBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: shellSpacing.sm,
    paddingVertical: shellSpacing.sm,
  },
  thumbnail: {
    borderRadius: shellRadii.button,
    height: 64,
    width: 64,
  },
  content: {
    flex: 1,
    gap: shellSpacing.xs,
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
    backgroundColor: shellColors.pillBackground,
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
