import { Image, Pressable, StyleSheet, View } from 'react-native';

// Types
import type { HotelAvailability } from '@repo/types';

// Constants
import { HOTEL_AMENITIES_MAX_DISPLAY } from '@repo/constants';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatPrice } from '@repo/utils';
import type { HotelBadge } from '../utils/hotel';

// Components
import { Typography } from './common';

interface HotelOptionItemProps {
  hotel: HotelAvailability;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  badge?: HotelBadge;
  isBookingLocked?: boolean;
}

export const HotelOptionItem = ({
  hotel,
  isSelected = false,
  onSelect,
  badge,
  isBookingLocked = false,
}: HotelOptionItemProps) => {
  const visibleAmenities = hotel.amenities.slice(0, HOTEL_AMENITIES_MAX_DISPLAY);
  const extraAmenities = hotel.amenities.length - visibleAmenities.length;

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {hotel.imageUrl && (
        <Image resizeMode="cover" source={{ uri: hotel.imageUrl }} style={styles.thumbnail} />
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Typography weight="medium">{hotel.name}</Typography>
            <View style={styles.starRow}>
              <Typography variant="meta">{'⭐'.repeat(hotel.starRating)}</Typography>
              <View style={styles.ratingPill}>
                <Typography variant="label">★ {hotel.rating.toFixed(1)}/5</Typography>
              </View>
            </View>
          </View>
          {badge && (
            <View style={styles.badge}>
              <Typography variant="label">{badge.label}</Typography>
            </View>
          )}
        </View>

        {visibleAmenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {visibleAmenities.map((amenity) => (
              <View key={amenity} style={styles.amenityPill}>
                <Typography variant="label">{amenity}</Typography>
              </View>
            ))}
            {extraAmenities > 0 && (
              <Typography color="faint" variant="label">
                +{extraAmenities} more
              </Typography>
            )}
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.priceBlock}>
            <Typography weight="semibold">
              {formatPrice(hotel.pricePerNight, hotel.currency)}/night
            </Typography>
            <Typography color="faint" variant="meta">
              {formatPrice(hotel.totalPrice, hotel.currency)} total
              {hotel.nights ? ` · ${hotel.nights} night${hotel.nights !== 1 ? 's' : ''}` : ''}
            </Typography>
          </View>
          {onSelect &&
            (isSelected ? (
              <Typography color="muted" variant="meta" weight="medium">
                Selected
              </Typography>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isBookingLocked}
                onPress={() => onSelect(hotel.id)}
                style={[styles.selectButton, isBookingLocked && styles.selectButtonDisabled]}
              >
                <Typography variant="label" weight="semibold">
                  Select
                </Typography>
              </Pressable>
            ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.button,
    borderWidth: 1,
    overflow: 'hidden',
  },
  containerSelected: {
    borderColor: shellColors.accentGradientStart,
    borderWidth: 2,
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
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  starRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: shellSpacing.xs,
  },
  ratingPill: {
    alignSelf: 'flex-start',
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
  badge: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
  amenitiesRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: shellSpacing.xs,
  },
  amenityPill: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: shellSpacing.sm,
    justifyContent: 'space-between',
  },
  priceBlock: {
    flex: 1,
    gap: 2,
  },
  selectButton: {
    backgroundColor: shellColors.accentGradientStart,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.sm,
    paddingVertical: shellSpacing.xs,
  },
  selectButtonDisabled: {
    opacity: 0.4,
  },
});
