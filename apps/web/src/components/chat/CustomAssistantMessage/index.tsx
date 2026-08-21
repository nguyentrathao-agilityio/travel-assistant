import { AssistantMessageProps, Markdown } from '@copilotkit/react-ui';
import { Bot, Copy, ThumbsUp, ThumbsDown, RotateCw } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

// Components
import { Button } from '@/components';
import { TypingIndicator } from '../TypingIndicator';

// Constants
import { COPY_FEEDBACK_DURATION_MS } from '@/constants';

const hasRenderedContent = (node: Node): boolean => {
  if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) return false;

  const tagName = node.tagName.toLowerCase();

  if (['canvas', 'iframe', 'img', 'input', 'svg', 'video'].includes(tagName)) return true;

  return [...node.childNodes].some(hasRenderedContent);
};

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
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
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
  const messageContent = typeof content === 'string' ? content : '';
  const hasMessage = messageContent.trim().length > 0;
  const hasPotentialCard = assistantUi !== null && assistantUi !== undefined;
  const [hasCard, setHasCard] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = cardContainerRef.current;

    if (!container) {
      setHasCard(false);

      return;
    }

    const updateHasCard = () => setHasCard([...container.childNodes].some(hasRenderedContent));

    updateHasCard();

    const observer = new MutationObserver(updateHasCard);

    observer.observe(container, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [assistantUi]);

  // Potential generative UI must mount once so its actual rendered DOM can be inspected.
  const hasContent = hasMessage || isLoading || hasPotentialCard;

  if (!hasContent) return null;

  const renderBefore = hasPotentialCard && assistantUiPosition === 'before';
  const renderAfter = hasPotentialCard && assistantUiPosition !== 'before';

  return (
    <div className="flex max-w-[80%] gap-3 py-2">
      {/* Avatar */}
      {(hasMessage || hasCard) && (
        <div
          aria-label="Assistant avatar"
          className="bg-assistant-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        >
          <Bot size={18} />
        </div>
      )}

      {/* Content container */}
      <div className="flex flex-col gap-2">
        {/* Generative UI (before) */}
        {renderBefore && <div ref={cardContainerRef}>{assistantUi}</div>}

        {/* Message bubble */}
        {(hasMessage || (isLoading && !message?.toolCalls)) && (
          <div
            className={`assistant-message-text bg-background-secondary text-body text-text-primary rounded-[28px] px-4 py-2 shadow ${
              isCurrentMessage ? 'ring-border-secondary ring-1' : ''
            }`}
          >
            {hasMessage ? (
              <Markdown content={messageContent} components={markdownTagRenderers} />
            ) : (
              <TypingIndicator className="p-0" />
            )}
          </div>
        )}
        {/* Generative UI (after) */}
        {renderAfter && <div ref={cardContainerRef}>{assistantUi}</div>}
        {/* Action buttons */}
        {hasMessage && (
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

            <CopyButton content={messageContent} onCopyAction={onCopy} />

            <Button
              variant="ghost"
              aria-label="Thumbs up"
              title="Thumbs up"
              onClick={() => message && onThumbsUp?.(message)}
              className={`p-1.5 ${feedback === 'thumbsUp' ? 'text-brand-600' : 'text-text-tertiary'}`}
            >
              <ThumbsUp size={16} />
            </Button>

            <Button
              variant="ghost"
              aria-label="Thumbs down"
              title="Thumbs down"
              onClick={() => message && onThumbsDown?.(message)}
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
