import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/common/Button';

interface ResetThreadModalProps {
  threadTitle: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetThreadModal = ({ threadTitle, onConfirm, onCancel }: ResetThreadModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus dialog on open so keyboard users can immediately interact
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-thread-title"
        aria-describedby="reset-thread-desc"
        tabIndex={-1}
        className="bg-background-page border-border-secondary relative z-10 w-full max-w-sm rounded-xl border p-6 shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-badge-warning-bg/40 dark:bg-badge-warning-bg mb-4 flex h-10 w-10 items-center justify-center rounded-full">
          <RotateCcw size={18} className="text-badge-warning-text" aria-hidden="true" />
        </div>

        <h2 id="reset-thread-title" className="text-card-title text-text-primary mb-1 font-medium">
          Reset conversation?
        </h2>
        <p id="reset-thread-desc" className="text-body text-text-secondary font-regular mb-6">
          {threadTitle ? (
            <>
              <span className="text-text-primary font-medium">"{threadTitle}"</span> will be cleared
              and start fresh from a blank chat. This can't be undone.
            </>
          ) : (
            "This conversation will be cleared and start fresh from a blank chat. This can't be undone."
          )}
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="brand" size="sm" onClick={onConfirm}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
