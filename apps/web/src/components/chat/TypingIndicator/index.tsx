// components/chat/TypingIndicator/index.tsx
import { cn } from '@/utils';

interface TypingIndicatorProps {
  label?: string;
  className?: string;
}

/**
 * Animated three-dot indicator shown while the AI is generating a response.
 * @example
 * {isStreaming && <TypingIndicator label="Planning your trip…" />}
 */
const TypingIndicator = ({ label = 'AI is thinking', className }: TypingIndicatorProps) => (
  <div
    role="status"
    aria-label={label}
    className={cn('flex items-center gap-2 px-4 py-2', className)}
  >
    <div className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 0.15}s` }}
          className="bg-text-tertiary h-1.5 w-1.5 animate-bounce rounded-full motion-reduce:animate-none"
        />
      ))}
    </div>
    <span className="font-regular text-text-tertiary text-sm">{label}</span>
  </div>
);

export { TypingIndicator };
export type { TypingIndicatorProps };
