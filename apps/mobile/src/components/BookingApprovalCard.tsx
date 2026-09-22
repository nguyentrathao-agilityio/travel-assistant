import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

// Constants
import { BOOKING_ACTIONS, BOOKING_DECISIONS } from '@repo/constants';
import {
  BOOKING_ACTION_ICON,
  NON_EDITABLE_DETAIL_KEYS,
  SUBMIT_TIMEOUT_MESSAGE,
  SUBMIT_TIMEOUT_MS,
} from '../constants';

// Components
import { Card, Typography } from './common';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { formatPrice } from '@repo/utils';

// Types
import type { ShellColors } from '../theme';
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

type EditableBookingDetails = Record<string, string | number | boolean | null>;

interface BookingApprovalCardProps {
  request: BookingApprovalRequest;
  onDecision: (decision: BookingDecision, editedDetails?: EditableBookingDetails) => void;
}

export const BookingApprovalCard = ({ request, onDecision }: BookingApprovalCardProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<EditableBookingDetails>(request.details);
  const [hasSavedChanges, setHasSavedChanges] = useState(false);
  const isCancellation = request.action === BOOKING_ACTIONS.CANCEL;
  const canEdit = !isCancellation && request.allowedDecisions.includes(BOOKING_DECISIONS.EDIT);
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    },
    []
  );

  const armSubmitTimeout = useCallback(() => {
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);

    submitTimeoutRef.current = setTimeout(() => {
      setSubmitted(false);
      setSubmitError(SUBMIT_TIMEOUT_MESSAGE);
    }, SUBMIT_TIMEOUT_MS);
  }, []);

  const handleConfirm = useCallback(() => {
    setSubmitted(true);
    setSubmitError(null);
    armSubmitTimeout();
    onDecision(
      hasSavedChanges ? BOOKING_DECISIONS.EDIT : BOOKING_DECISIONS.APPROVE,
      hasSavedChanges ? editedDetails : undefined
    );
  }, [armSubmitTimeout, editedDetails, hasSavedChanges, onDecision]);

  const handleReject = useCallback(() => {
    setSubmitted(true);
    setSubmitError(null);
    armSubmitTimeout();
    onDecision(BOOKING_DECISIONS.REJECT);
  }, [armSubmitTimeout, onDecision]);

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
        <Typography>{BOOKING_ACTION_ICON[request.action] ?? '📋'}</Typography>
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

      {submitError && (
        <Typography color="danger" variant="meta">
          {submitError}
        </Typography>
      )}

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

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
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
      backgroundColor: colors.pillBackground,
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
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      color: colors.textOnDark,
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
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.button,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    buttonDisabled: {
      opacity: 0.4,
    },
  });
