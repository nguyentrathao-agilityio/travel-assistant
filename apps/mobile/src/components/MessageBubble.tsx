import { useRenderToolCall } from '@copilotkit/react-native/headless';
import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';

// Components
import { MarkdownText } from './common/MarkdownText';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { messageText } from '../utils/chatMessages';

// Types
import type { Message, ToolMessage } from '@copilotkit/react-native/headless';
import type { ShellColors } from '../theme';
import type { RenderableMessage } from '../utils/chatMessages';

interface MessageBubbleProps {
  message: RenderableMessage;
  toolMessageIndex: Map<string, ToolMessage>;
}

const ToolCallFallback = ({ name }: { name: string }) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.toolCallFallback}>
      <Text style={styles.toolCallFallbackText}>Using {name}…</Text>
    </View>
  );
};

export const ThinkingIndicator = () => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.35))).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled || reduceMotion) return;

      animation = Animated.loop(
        Animated.stagger(
          140,
          dots.map((opacity) =>
            Animated.sequence([
              Animated.timing(opacity, { duration: 280, toValue: 1, useNativeDriver: true }),
              Animated.timing(opacity, { duration: 280, toValue: 0.35, useNativeDriver: true }),
            ])
          )
        )
      );
      animation.start();
    });

    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [dots]);

  return (
    <View
      accessibilityLabel="AI is responding"
      accessibilityRole="progressbar"
      style={styles.thinkingBubble}
    >
      {dots.map((opacity, index) => (
        <Animated.View key={index} style={[styles.thinkingDot, { opacity }]} />
      ))}
    </View>
  );
};

const ToolCallRow = ({
  toolCall,
  toolMessageIndex,
}: {
  toolCall: NonNullable<Extract<Message, { role: 'assistant' }>['toolCalls']>[number];
  toolMessageIndex: Map<string, ToolMessage>;
}) => {
  const renderToolCall = useRenderToolCall();
  const toolMessage = toolMessageIndex.get(toolCall.id);
  const rendered = renderToolCall({ toolCall, toolMessage });
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.toolCallContent}>
      {rendered ?? <ToolCallFallback name={toolCall.function.name} />}
    </View>
  );
};

export const MessageBubble = ({ message, toolMessageIndex }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const text = messageText(message.content).trim();
  const toolCalls = message.role === 'assistant' ? message.toolCalls : undefined;
  const isThinking = !isUser && !text && !toolCalls?.length;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {isThinking ? (
        <ThinkingIndicator />
      ) : !!text ? (
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <MarkdownText style={styles.bubbleText}>{text}</MarkdownText>
        </View>
      ) : null}
      {toolCalls?.map((toolCall) => (
        <ToolCallRow key={toolCall.id} toolCall={toolCall} toolMessageIndex={toolMessageIndex} />
      ))}
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    row: {
      marginBottom: shellSpacing.md,
    },
    rowUser: {
      alignItems: 'flex-end',
    },
    rowAssistant: {
      alignItems: 'flex-start',
    },
    bubble: {
      borderRadius: shellRadii.card + 4,
      maxWidth: '85%',
      paddingHorizontal: shellSpacing.md + 2,
      paddingVertical: shellSpacing.sm + 2,
    },
    toolCallContent: {
      marginTop: shellSpacing.xs,
      maxWidth: '85%',
      width: '100%',
    },
    bubbleUser: {
      backgroundColor: colors.bubbleUserBackground,
    },
    bubbleAssistant: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
    },
    bubbleText: {
      color: colors.textOnDark,
      fontSize: 15,
      lineHeight: 21,
    },
    thinkingBubble: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
      minHeight: 20,
    },
    thinkingDot: {
      backgroundColor: colors.textOnDarkMuted,
      borderRadius: 4,
      height: 7,
      width: 7,
    },
    toolCallFallback: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.card,
      borderWidth: 1,
      marginTop: shellSpacing.xs,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    toolCallFallbackText: {
      color: colors.textOnDarkFaint,
      fontSize: 13,
      fontStyle: 'italic',
    },
  });
