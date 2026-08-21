import { useState, useCallback, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { ArrowRight, Square } from 'lucide-react';
import type { InputProps } from '@copilotkit/react-ui';
import { useAgent } from '@copilotkit/react-core/v2';

// Stores
import { useSuggestionStore } from '@/stores';

// Hooks
import { useInterruptElement } from '@/hooks';

// Utils
import { cn } from '@/utils';

// Components
import { Button } from '@/components';

// Constants
import { AGENT_NAME, CHAT_ROLE, MAX_CHAT_TEXTAREA_HEIGHT } from '@/constants';

const ChatInputBar = ({ onSend, onStop, inProgress, hideStopButton = false }: InputProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { agent } = useAgent({ agentId: AGENT_NAME });
  const messages = agent.messages;
  const isAwaitingApproval = useInterruptElement() !== null;

  const setOnSend = useSuggestionStore((s) => s.setOnSend);
  const setLastTool = useSuggestionStore((s) => s.setLastTool);

  useEffect(() => {
    setOnSend(onSend);
  }, [onSend, setOnSend]);

  const lastAssistantIdx = messages.reduce(
    (lastIdx, msg, idx) => (msg.role === CHAT_ROLE.ASSISTANT ? idx : lastIdx),
    -1
  );
  const lastAssistantMsg =
    lastAssistantIdx !== -1 ? (messages[lastAssistantIdx] as { toolCalls?: unknown[] }) : undefined;
  const hasToolResultAfter = messages
    .slice(lastAssistantIdx + 1)
    .some((msg) => msg.role === CHAT_ROLE.TOOL);
  const isToolCallPending = Boolean(lastAssistantMsg?.toolCalls?.length) && !hasToolResultAfter;

  const submitDisabled = inProgress || isToolCallPending || isAwaitingApproval;

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();

    if (!trimmed || submitDisabled) return;

    setLastTool(null);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onSend(trimmed);
  }, [value, submitDisabled, onSend, setLastTool]);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;

    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_CHAT_TEXTAREA_HEIGHT)}px`;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="bg-background-page px-5 pb-5 pt-4">
      <div className="hover:shadow-input-hover focus-within:shadow-input-focus bg-background-primary flex items-center justify-center gap-3 rounded-xl px-4 py-3 shadow transition-shadow">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your trip..."
          rows={1}
          aria-label="Chat message"
          className="text-body font-regular text-text-primary placeholder:text-text-tertiary flex-1 resize-none bg-transparent outline-none"
        />
        {inProgress && !hideStopButton ? (
          <Button
            onClick={onStop}
            aria-label="Stop generating"
            className="bg-brand-500 mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity"
            rightIcon={<Square size={14} className="fill-current text-white" />}
          />
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitDisabled}
            aria-label="Send message"
            className={cn(
              'bg-brand-500 mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity',
              submitDisabled && 'opacity-40'
            )}
            rightIcon={<ArrowRight size={16} className="text-white" />}
          />
        )}
      </div>

      <div className="flex justify-center">
        <p className="text-meta font-regular text-text-tertiary mt-3">
          Travel AI can make mistakes. Always verify important information before booking.
        </p>
      </div>
    </div>
  );
};

export { ChatInputBar };
