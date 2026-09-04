import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

import { shellColors, shellSpacing } from '../theme';

interface ChatPlaceholderScreenProps {
  threadId?: string;
  focusVoice?: boolean;
}

export const ChatPlaceholderScreen = ({ threadId, focusVoice }: ChatPlaceholderScreenProps) => (
  <LinearGradient
    colors={[shellColors.backgroundGradientStart, shellColors.backgroundGradientEnd]}
    style={styles.container}
  >
    <Text style={styles.title}>Chat</Text>
    <Text style={styles.body}>
      The full chat experience (transcript, streaming, tool cards) is separate follow-up work — see
      docs/react-native-days/day-07-native-chat-shell.md.
      {'\n\n'}
      Thread: {threadId ?? 'new'}
      {focusVoice ? '\nVoice entry requested (voice ships in Day 11).' : ''}
    </Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: shellSpacing.xl,
  },
  title: {
    color: shellColors.textOnDark,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: shellSpacing.md,
  },
  body: {
    color: shellColors.textOnDarkMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
