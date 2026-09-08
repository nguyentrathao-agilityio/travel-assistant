import { StyleSheet, View } from 'react-native';

// Types
import type { PlaceSearchResult } from '@repo/types';

// Utils
import { shellSpacing } from '../theme';

// Components
import { Typography } from './common';
import { PlaceItem } from './PlaceItem';

interface TripPlacesSectionProps {
  places: PlaceSearchResult;
}

const MAX_PLACES = 6;

export const TripPlacesSection = ({ places }: TripPlacesSectionProps) => {
  if (!places.results.length) return null;

  const topPlaces = places.results.slice(0, MAX_PLACES);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Typography color="faint" variant="label" weight="semibold">
          TOP PLACES
        </Typography>
        <Typography color="faint" variant="label">
          {topPlaces.length} total
        </Typography>
      </View>

      <View>
        {topPlaces.map((place) => (
          <PlaceItem key={place.id} place={place} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: shellSpacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
