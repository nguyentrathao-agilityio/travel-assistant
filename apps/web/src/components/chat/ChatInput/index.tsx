// components/chat/ChatInput/index.tsx
import { useState, useCallback, useRef } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { cn } from '@/utils';
import { Button } from '@/components';
import { Send } from 'lucide-react';

const QUICK_PROMPTS = [
  'Plan a 7-day Vietnam trip',
  'Best time to visit Bali',
  'Budget trip to Japan',
  'Family-friendly Europe itinerary',
];

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Chat input bar with send button, quick-prompt chips, and keyboard shortcut.
 * Submits on Enter (Shift+Enter = new line). Disabled while AI is streaming.
 *
 * @example
 * <ChatInput onSend={handleSend} isStreaming={isStreaming} />
 */
const ChatInput = ({
  onSend,
  isStreaming = false,
  placeholder = 'Ask me anything about your trip…',
  className,
}: ChatInputProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();

    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, onSend]);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;

    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleQuickPrompt = useCallback((prompt: string) => {
    setValue(prompt);
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      className={cn('border-border-tertiary bg-background-primary border-t px-4 py-3', className)}
    >
      {/* Quick prompts — shown only when input is empty */}
      {!value && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              onClick={() => handleQuickPrompt(p)}
              className="rounded-pill border-border-secondary font-regular text-meta text-text-secondary border py-1"
            >
              {p}
            </Button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="border-border-secondary bg-background-secondary focus-within:border-border-info focus-within:ring-border-info flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors focus-within:ring-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          rows={1}
          aria-label="Chat message"
          className="text-body font-regular text-text-primary placeholder:text-text-tertiary flex-1 resize-none bg-transparent outline-none disabled:opacity-50"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!value.trim() || isStreaming}
          aria-label="Send message"
          leftIcon={<Send size={14} />}
        >
          Send
        </Button>
      </div>

      <p className="text-meta font-regular text-text-tertiary mt-1.5 text-center">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};

export { ChatInput };
export type { ChatInputProps };
