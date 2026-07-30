import { AssistantMessageProps, Markdown } from '@copilotkit/react-ui';
import { Bot, Copy, ThumbsUp, ThumbsDown, RotateCw } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components';
import { TypingIndicator } from '../TypingIndicator';

const CopyButton = ({
  content,
  onCopyAction,
}: {
  content: string;
  onCopyAction?: (message: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (!content) return;
    try {
      setCopied(true);
      await navigator.clipboard.writeText(content);
      if (onCopyAction) onCopyAction(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore clipboard errors silently
    }
  };

  return (
    <Button
      variant="ghost"
      aria-label="Copy"
      title="Copy"
      onClick={handleClick}
      className="text-text-tertiary p-1.5"
    >
      {copied ? <span className="font-medium text-green-500">✓</span> : <Copy size={16} />}
    </Button>
  );
};

const CustomAssistantMessage = (props: AssistantMessageProps) => {
  const {
    message,
    isLoading,
    isCurrentMessage,
    markdownTagRenderers,
    onCopy,
    onRegenerate,
    onThumbsUp,
    onThumbsDown,
    feedback,
  } = props;

  const content = message?.content;
  const assistantUi = message?.generativeUI?.() ?? null;
  const assistantUiPosition = message?.generativeUIPosition ?? 'before';

  // Render nothing if there's no content, loading state, or generative UI
  const hasContent = Boolean(content || isLoading || (assistantUi && assistantUi !== <div></div>));
  if (!hasContent) return null;

  const renderBefore = Boolean(assistantUi && assistantUiPosition === 'before');
  const renderAfter = Boolean(assistantUi && assistantUiPosition !== 'before');

  return (
    <div className="flex max-w-[80%] gap-3 py-2">
      {/* Avatar */}
      {(content || renderAfter || renderBefore || (isLoading && !message?.toolCalls)) && (
        <div className="bg-assistant-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
          <Bot size={18} />
        </div>
      )}

      {/* Content container */}
      <div className="flex flex-col gap-2">
        {/* Generative UI (before) */}
        {renderBefore && <div>{assistantUi}</div>}

        {/* Message bubble */}
        {(content || (isLoading && !message?.toolCalls)) && (
          <div
            className={`bg-background-secondary text-text-primary rounded-[28px] px-4 py-2 shadow ${
              isCurrentMessage ? 'ring-border-secondary ring-1' : ''
            }`}
          >
            {content ? (
              <Markdown content={content} components={markdownTagRenderers} />
            ) : (
              <TypingIndicator className="p-0" />
            )}
          </div>
        )}
        {/* Generative UI (after) */}
        {renderAfter && <div>{assistantUi}</div>}
        {/* Action buttons */}
        {content && (
          <div className="flex h-6 items-center gap-2 pl-5">
            <Button
              variant="ghost"
              aria-label="Regenerate"
              title="Regenerate"
              onClick={() => onRegenerate?.()}
              className="text-text-tertiary p-1.5"
            >
              <RotateCw size={16} />
            </Button>

            <CopyButton
              content={typeof content === 'string' ? content : String(content)}
              onCopyAction={onCopy}
            />

            <Button
              variant="ghost"
              aria-label="Thumbs up"
              title="Thumbs up"
              onClick={() => onThumbsUp?.(message)}
              className={`p-1.5 ${feedback === 'thumbsUp' ? 'text-brand-600' : 'text-text-tertiary'}`}
            >
              <ThumbsUp size={16} />
            </Button>

            <Button
              variant="ghost"
              aria-label="Thumbs down"
              title="Thumbs down"
              onClick={() => onThumbsDown?.(message)}
              className={`p-1.5 ${feedback === 'thumbsDown' ? 'text-red-500' : 'text-text-tertiary'}`}
            >
              <ThumbsDown size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export { CustomAssistantMessage };
