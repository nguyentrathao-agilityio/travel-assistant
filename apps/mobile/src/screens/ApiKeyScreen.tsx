import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// Constants
import { OPENAI_KEYS_URL } from '../constants';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Types
import type { ShellColors } from '../theme';

interface ApiKeyScreenProps {
  isVerifying: boolean;
  error: string | null;
  onSubmit: (apiKey: string) => void;
}

export const ApiKeyScreen = ({ isVerifying, error, onSubmit }: ApiKeyScreenProps) => {
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSubmit = () => {
    if (!value.trim() || isVerifying) return;
    onSubmit(value);
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>OpenAI API key</Text>
        <Text style={styles.description}>
          Your key is stored securely on this device (Keychain/Keystore) and sent to the agent
          runtime with every request. It is never written to plain app storage.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isVerifying}
            onChangeText={setValue}
            placeholder="sk-…"
            placeholderTextColor={colors.textOnDarkFaint}
            secureTextEntry={!showKey}
            style={styles.input}
            value={value}
          />
          <Pressable
            accessibilityLabel={showKey ? 'Hide API key' : 'Show API key'}
            accessibilityRole="button"
            disabled={isVerifying}
            onPress={() => setShowKey((prev) => !prev)}
          >
            <Text style={styles.toggleLabel}>{showKey ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          disabled={!value.trim() || isVerifying}
          onPress={handleSubmit}
        >
          <LinearGradient
            colors={[colors.accentGradientStart, colors.accentGradientEnd]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={[styles.submitButton, (!value.trim() || isVerifying) && styles.submitDisabled]}
          >
            <Text style={styles.submitLabel}>{isVerifying ? 'Verifying…' : 'Continue'}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(OPENAI_KEYS_URL)}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>Don&apos;t have a key? Get one from OpenAI</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: shellSpacing.xl,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.card,
      borderWidth: 1,
      padding: shellSpacing.lg,
      width: '100%',
    },
    title: {
      color: colors.textOnDark,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: shellSpacing.xs,
    },
    description: {
      color: colors.textOnDarkMuted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: shellSpacing.lg,
    },
    inputRow: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
    },
    input: {
      color: colors.textOnDark,
      flex: 1,
      fontSize: 15,
      paddingVertical: shellSpacing.md,
    },
    toggleLabel: {
      color: colors.textOnDarkMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      marginBottom: shellSpacing.sm,
    },
    submitButton: {
      alignItems: 'center',
      borderRadius: shellRadii.button,
      marginTop: shellSpacing.sm,
      paddingVertical: shellSpacing.md,
    },
    submitDisabled: {
      opacity: 0.4,
    },
    submitLabel: {
      color: colors.textOnDark,
      fontSize: 16,
      fontWeight: '700',
    },
    linkRow: {
      alignItems: 'center',
      marginTop: shellSpacing.lg,
    },
    linkText: {
      color: colors.accentGradientEnd,
      fontSize: 13,
    },
  });
