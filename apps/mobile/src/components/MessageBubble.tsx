import { useRenderToolCall } from '@copilotkit/react-native/headless';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { findToolMessage, messageText } from '../utils/chatMessages';

import type { ShellColors } from '../theme';
import type { RenderableMessage } from '../utils/chatMessages';
import type { Message } from '@copilotkit/react-native/headless';

interface MessageBubbleProps {
  message: RenderableMessage;
  allMessages: Message[];
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

const ToolCallRow = ({
  toolCall,
  allMessages,
}: {
  toolCall: NonNullable<Extract<Message, { role: 'assistant' }>['toolCalls']>[number];
  allMessages: Message[];
}) => {
  const renderToolCall = useRenderToolCall();
  const toolMessage = findToolMessage(allMessages, toolCall.id);
  const rendered = renderToolCall({ toolCall, toolMessage });
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.toolCallContent}>
      {rendered ?? <ToolCallFallback name={toolCall.function.name} />}
    </View>
  );
};

export const MessageBubble = ({ message, allMessages }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const text = messageText(message.content).trim();
  const toolCalls = message.role === 'assistant' ? message.toolCalls : undefined;
  const isThinking = !isUser && !text && !toolCalls?.length;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {(isThinking || !!text) && (
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          {isThinking ? (
            <Text style={styles.thinkingText}>…</Text>
          ) : (
            <Text style={styles.bubbleText}>{text}</Text>
          )}
        </View>
      )}
      {toolCalls?.map((toolCall) => (
        <ToolCallRow allMessages={allMessages} key={toolCall.id} toolCall={toolCall} />
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
      borderRadius: shellRadii.card,
      maxWidth: '85%',
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
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
    thinkingText: {
      color: colors.textOnDarkMuted,
      fontSize: 15,
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
