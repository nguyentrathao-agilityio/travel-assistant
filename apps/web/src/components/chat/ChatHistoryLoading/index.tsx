import { cn } from '@/utils';

const SkeletonBubble = ({ align, sizes }: { align: 'left' | 'right'; sizes: string[] }) => {
  const isRight = align === 'right';

  return (
    <div className={cn('flex w-full py-2', isRight ? 'justify-end' : 'justify-start')}>
      <div
        className={cn('flex max-w-[80%] gap-2', isRight ? 'flex-row-reverse items-end' : 'gap-3')}
      >
        {/* Avatar skeleton */}
        <div
          aria-hidden="true"
          className={cn(
            'bg-border-tertiary shrink-0 animate-pulse rounded-full',
            isRight ? 'h-8 w-8' : 'h-10 w-10'
          )}
        />

        {/* Message bubble skeleton */}
        <div className="flex flex-col gap-1.5">
          {sizes.map((size, index) => (
            <div
              key={index}
              aria-hidden="true"
              className={cn('bg-border-tertiary h-10 animate-pulse rounded-2xl', size)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton placeholder shown while thread history is being fetched.
 * Simulates alternating user/assistant bubbles to preserve layout during load.
 */
const ChatHistoryLoading = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading chat history"
    className="flex flex-col px-1 pt-2"
  >
    <SkeletonBubble align="right" sizes={['w-48 h-10']} />
    <SkeletonBubble align="left" sizes={['w-64 h-30', 'w-56 h-10']} />
    <SkeletonBubble align="right" sizes={['w-36 h-10']} />
    <SkeletonBubble align="left" sizes={['w-72 h-10', 'w-60 h-20']} />
  </div>
);

export { ChatHistoryLoading };
