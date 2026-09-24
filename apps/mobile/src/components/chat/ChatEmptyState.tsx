import { ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { DESTINATION_PILLS, EMPTY_STATE_SUGGESTIONS } from '../../constants';
import { useShellTheme } from '../../theme';
import { ChatScrollView } from './ChatScrollView';
import { createChatEmptyStateStyles } from './ChatEmptyState.styles';

interface ChatEmptyStateProps {
  disabled: boolean;
  onSuggestionPress: (message: string) => void;
}

export const ChatEmptyState = ({ disabled, onSuggestionPress }: ChatEmptyStateProps) => {
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const { colors } = useShellTheme();
  const styles = useMemo(() => createChatEmptyStateStyles(colors), [colors]);

  return (
    <ChatScrollView
      contentContainerStyle={[styles.content, isKeyboardVisible && styles.keyboardVisible]}
      keyboardLiftBehavior="never"
      style={styles.scroll}
    >
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Where to next?</Text>
        <Text style={styles.description}>
          I&apos;ll help you plan the trip — itineraries, flights, places to stay, and where the
          locals actually eat.
        </Text>
        <View style={styles.destinationPills}>
          {DESTINATION_PILLS.map((city) => (
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              key={city}
              onPress={() => onSuggestionPress(`Plan a trip to ${city}`)}
              style={styles.destinationPill}
            >
              <Text style={styles.destinationPillLabel}>{city}</Text>
              <ArrowRight color={colors.textOnDark} size={12} />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.quickActions}>
        {EMPTY_STATE_SUGGESTIONS.map(({ description, icon: ActionIcon, message, title }) => (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            key={title}
            onPress={() => onSuggestionPress(message)}
            style={styles.quickAction}
          >
            <ActionIcon color={colors.textOnDarkMuted} size={18} strokeWidth={2.1} />
            <View style={styles.quickActionCopy}>
              <Text numberOfLines={1} style={styles.quickActionLabel}>
                {title}
              </Text>
              <Text numberOfLines={1} style={styles.quickActionDescription}>
                {description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ChatScrollView>
  );
};
