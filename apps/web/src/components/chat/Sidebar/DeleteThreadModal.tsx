import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/common/Button';

interface DeleteThreadModalProps {
  threadTitle: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteThreadModal = ({ threadTitle, onConfirm, onCancel }: DeleteThreadModalProps) => {
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
        aria-labelledby="delete-thread-title"
        aria-describedby="delete-thread-desc"
        tabIndex={-1}
        className="bg-background-page border-border-secondary relative z-10 w-full max-w-sm rounded-xl border p-6 shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-badge-danger-bg/40 dark:bg-badge-danger-bg mb-4 flex h-10 w-10 items-center justify-center rounded-full">
          <Trash2 size={18} className="text-badge-danger-text" aria-hidden="true" />
        </div>

        <h2 id="delete-thread-title" className="text-text-primary mb-1 text-base font-semibold">
          Delete conversation?
        </h2>
        <p id="delete-thread-desc" className="text-text-secondary mb-6 text-sm">
          {threadTitle ? (
            <>
              <span className="text-text-primary font-medium">"{threadTitle}"</span> will be
              permanently deleted and cannot be recovered.
            </>
          ) : (
            'This conversation will be permanently deleted and cannot be recovered.'
          )}
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
