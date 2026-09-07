import { StyleSheet, View } from 'react-native';

import { shellSpacing } from '../theme';
import { Card, EmptyState, Typography } from './common';
import { PlaceItem } from './PlaceItem';

import type { PlaceSearchResult } from '@repo/types';

interface PlacesCardProps {
  data: PlaceSearchResult;
}

export const PlacesCard = ({ data }: PlacesCardProps) => {
  const total = data.results.length ?? 0;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Typography style={styles.title} variant="title" weight="medium">
          📍 Places{data.city ? ` in ${data.city}` : ''}
        </Typography>
        <Typography color="muted" variant="meta">
          {total} place{total !== 1 ? 's' : ''}
        </Typography>
      </View>

      {data.results.length ? (
        data.results.map((place) => <PlaceItem key={place.id} place={place} />)
      ) : (
        <EmptyState message="No places in this category" />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
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
});
