import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

// Types
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

// Constants
import { BOOKING_ACTIONS, BOOKING_DECISIONS } from '@repo/constants';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatPrice } from '@repo/utils';

// Components
import { Card, Typography } from './common';

type EditableBookingDetails = Record<string, string | number | boolean | null>;

// Reference identifiers tie the approval to a specific, already-revalidated search
// result — changing them here wouldn't re-run availability/price revalidation, so they
// display but never become an editable input.
const NON_EDITABLE_DETAIL_KEYS = new Set(['flightId', 'hotelId']);

const ACTION_ICON: Record<string, string> = {
  [BOOKING_ACTIONS.CREATE_FLIGHT]: '✈️',
  [BOOKING_ACTIONS.CANCEL]: '⚠️',
  [BOOKING_ACTIONS.CREATE_HOTEL]: '🏨',
};

interface BookingApprovalCardProps {
  request: BookingApprovalRequest;
  onDecision: (decision: BookingDecision, editedDetails?: EditableBookingDetails) => void;
}

export const BookingApprovalCard = ({ request, onDecision }: BookingApprovalCardProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<EditableBookingDetails>(request.details);
  const [hasSavedChanges, setHasSavedChanges] = useState(false);
  const isCancellation = request.action === BOOKING_ACTIONS.CANCEL;
  const canEdit = !isCancellation && request.allowedDecisions.includes(BOOKING_DECISIONS.EDIT);

  const handleConfirm = useCallback(() => {
    setSubmitted(true);
    onDecision(
      hasSavedChanges ? BOOKING_DECISIONS.EDIT : BOOKING_DECISIONS.APPROVE,
      hasSavedChanges ? editedDetails : undefined
    );
  }, [editedDetails, hasSavedChanges, onDecision]);

  const handleReject = useCallback(() => {
    setSubmitted(true);
    onDecision(BOOKING_DECISIONS.REJECT);
  }, [onDecision]);

  const handleSaveChanges = useCallback(() => {
    setHasSavedChanges(true);
    setIsEditing(false);
  }, []);

  const handleDiscardChanges = useCallback(() => {
    setEditedDetails(request.details);
    setIsEditing(false);
  }, [request.details]);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Typography>{ACTION_ICON[request.action] ?? '📋'}</Typography>
        <Typography style={styles.title} variant="title" weight="medium">
          {request.title}
        </Typography>
      </View>

      <View style={styles.detailsGrid}>
        {Object.entries(editedDetails).map(([label, value]) => (
          <View key={label} style={styles.detailCell}>
            <Typography color="faint" variant="label">
              {label.toUpperCase()}
            </Typography>
            {isEditing && !NON_EDITABLE_DETAIL_KEYS.has(label) ? (
              <TextInput
                accessibilityLabel={label}
                keyboardType={typeof request.details[label] === 'number' ? 'numeric' : 'default'}
                onChangeText={(text) =>
                  setEditedDetails((current) => ({
                    ...current,
                    [label]: typeof request.details[label] === 'number' ? Number(text) : text,
                  }))
                }
                style={styles.input}
                value={String(value ?? '')}
              />
            ) : (
              <Typography numberOfLines={1} variant="meta">
                {String(value)}
              </Typography>
            )}
          </View>
        ))}
      </View>

      {request.totalPrice != null && request.currency && (
        <View style={styles.totalRow}>
          <Typography color="muted">Total</Typography>
          <Typography weight="semibold">
            {formatPrice(request.totalPrice, request.currency)}
          </Typography>
        </View>
      )}

      <Typography color="faint" variant="meta">
        {isCancellation
          ? 'Choose Keep booking to reject this cancellation and leave the booking active.'
          : hasSavedChanges
            ? 'Review the updated details, then confirm to create this booking.'
            : 'Choose Cancel to stop without creating this booking.'}
      </Typography>

      <View style={styles.buttonRow}>
        {isEditing ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={handleDiscardChanges}
              style={styles.secondaryButton}
            >
              <Typography weight="medium">Discard changes</Typography>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleSaveChanges}
              style={styles.primaryButton}
            >
              <Typography weight="semibold">Save changes</Typography>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={submitted}
              onPress={handleReject}
              style={[styles.secondaryButton, submitted && styles.buttonDisabled]}
            >
              <Typography weight="medium">{isCancellation ? 'Keep booking' : 'Cancel'}</Typography>
            </Pressable>
            {canEdit && (
              <Pressable
                accessibilityRole="button"
                disabled={submitted}
                onPress={() => setIsEditing(true)}
                style={[styles.secondaryButton, submitted && styles.buttonDisabled]}
              >
                <Typography weight="medium">Edit</Typography>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={submitted}
              onPress={handleConfirm}
              style={[styles.primaryButton, submitted && styles.buttonDisabled]}
            >
              <Typography weight="semibold">
                {submitted ? 'Submitting…' : isCancellation ? 'Cancel booking' : 'Confirm booking'}
              </Typography>
            </Pressable>
          </>
        )}
      </View>
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
  },
  title: {
    flex: 1,
  },
  detailsGrid: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.button,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: shellSpacing.sm,
    padding: shellSpacing.sm,
  },
  detailCell: {
    gap: 2,
    minWidth: '42%',
  },
  input: {
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.button,
    borderWidth: 1,
    color: shellColors.textOnDark,
    fontSize: 13,
    paddingHorizontal: shellSpacing.sm,
    paddingVertical: shellSpacing.xs,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: shellSpacing.sm,
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.button,
    borderWidth: 1,
    paddingHorizontal: shellSpacing.md,
    paddingVertical: shellSpacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: shellColors.accentGradientStart,
    borderRadius: shellRadii.button,
    paddingHorizontal: shellSpacing.md,
    paddingVertical: shellSpacing.sm,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
