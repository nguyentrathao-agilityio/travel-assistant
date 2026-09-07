import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { OPENAI_KEYS_URL } from '../constants';
import { shellColors, shellRadii, shellSpacing } from '../theme';

interface ApiKeyScreenProps {
  isVerifying: boolean;
  error: string | null;
  onSubmit: (apiKey: string) => void;
}

export const ApiKeyScreen = ({ isVerifying, error, onSubmit }: ApiKeyScreenProps) => {
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = () => {
    if (!value.trim() || isVerifying) return;
    onSubmit(value);
  };

  return (
    <LinearGradient
      colors={[shellColors.backgroundGradientStart, shellColors.backgroundGradientEnd]}
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
            placeholderTextColor={shellColors.textOnDarkFaint}
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
            colors={[shellColors.accentGradientStart, shellColors.accentGradientEnd]}
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: shellSpacing.xl,
  },
  card: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.card,
    borderWidth: 1,
    padding: shellSpacing.lg,
    width: '100%',
  },
  title: {
    color: shellColors.textOnDark,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: shellSpacing.xs,
  },
  description: {
    color: shellColors.textOnDarkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: shellSpacing.lg,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: shellColors.pillBackground,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.button,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: shellSpacing.sm,
    paddingHorizontal: shellSpacing.md,
  },
  input: {
    color: shellColors.textOnDark,
    flex: 1,
    fontSize: 15,
    paddingVertical: shellSpacing.md,
  },
  toggleLabel: {
    color: shellColors.textOnDarkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: shellColors.danger,
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
    color: shellColors.textOnDark,
    fontSize: 16,
    fontWeight: '700',
  },
  linkRow: {
    alignItems: 'center',
    marginTop: shellSpacing.lg,
  },
  linkText: {
    color: shellColors.accentGradientEnd,
    fontSize: 13,
  },
});
