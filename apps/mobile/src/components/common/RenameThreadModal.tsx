import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

interface RenameThreadModalProps {
  visible: boolean;
  initialTitle: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (title: string) => void;
}

export const RenameThreadModal = ({
  visible,
  initialTitle,
  isSaving,
  onCancel,
  onSave,
}: RenameThreadModalProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (visible) setTitle(initialTitle);
  }, [visible, initialTitle]);

  const trimmed = title.trim();
  const isSaveDisabled = isSaving || !trimmed;

  const handleSave = () => {
    if (isSaveDisabled) return;
    onSave(trimmed);
  };

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Rename trip</Text>
          <TextInput
            autoFocus
            onChangeText={setTitle}
            onSubmitEditing={handleSave}
            placeholder="Trip name"
            placeholderTextColor={colors.textOnDarkFaint}
            returnKeyType="done"
            style={styles.input}
            value={title}
          />
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.button}>
              <Text style={styles.buttonLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaveDisabled}
              onPress={handleSave}
              style={[styles.button, isSaveDisabled && styles.buttonDisabled]}
            >
              <Text style={styles.buttonLabel}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    backdrop: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: shellSpacing.lg,
    },
    card: {
      backgroundColor: colors.pillBackground,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.card,
      borderWidth: 1,
      gap: shellSpacing.md,
      padding: shellSpacing.lg,
      width: '100%',
    },
    title: {
      color: colors.textOnDark,
      fontSize: 16,
      fontWeight: '700',
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      color: colors.textOnDark,
      fontSize: 15,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: shellSpacing.sm,
      justifyContent: 'flex-end',
    },
    button: {
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    buttonLabel: {
      color: colors.textOnDark,
      fontSize: 14,
      fontWeight: '600',
    },
  });
