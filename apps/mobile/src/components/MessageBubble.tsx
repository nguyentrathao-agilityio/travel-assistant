import { useRenderToolCall } from '@copilotkit/react-native/headless';
import { StyleSheet, Text, View } from 'react-native';

import { shellColors, shellRadii, shellSpacing } from '../theme';
import { findToolMessage, messageText } from '../utils/chatMessages';

import type { RenderableMessage } from '../utils/chatMessages';
import type { Message } from '@copilotkit/react-native/headless';

interface MessageBubbleProps {
  message: RenderableMessage;
  allMessages: Message[];
}

const ToolCallFallback = ({ name }: { name: string }) => (
  <View style={styles.toolCallFallback}>
    <Text style={styles.toolCallFallbackText}>Using {name}…</Text>
  </View>
);

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

  return rendered ?? <ToolCallFallback name={toolCall.function.name} />;
};

export const MessageBubble = ({ message, allMessages }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const text = messageText(message.content).trim();
  const toolCalls = message.role === 'assistant' ? message.toolCalls : undefined;
  const isThinking = !isUser && !text && !toolCalls?.length;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {isThinking ? (
          <Text style={styles.thinkingText}>…</Text>
        ) : (
          text && <Text style={styles.bubbleText}>{text}</Text>
        )}
      </View>
      {toolCalls?.map((toolCall) => (
        <ToolCallRow allMessages={allMessages} key={toolCall.id} toolCall={toolCall} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
  bubbleUser: {
    backgroundColor: shellColors.accentGradientStart,
  },
  bubbleAssistant: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderWidth: 1,
  },
  bubbleText: {
    color: shellColors.textOnDark,
    fontSize: 15,
    lineHeight: 21,
  },
  thinkingText: {
    color: shellColors.textOnDarkMuted,
    fontSize: 15,
  },
  toolCallFallback: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.card,
    borderWidth: 1,
    marginTop: shellSpacing.xs,
    paddingHorizontal: shellSpacing.md,
    paddingVertical: shellSpacing.sm,
  },
  toolCallFallbackText: {
    color: shellColors.textOnDarkFaint,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
