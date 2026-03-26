'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'error' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'error',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const btnClass = variant === 'error' ? 'btn-error' : variant === 'warning' ? 'btn-warning' : 'btn-primary';

  return (
    <dialog ref={dialogRef} className="modal" onClose={onCancel}>
      <div className="modal-box max-w-sm bg-white">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="modal-action">
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button className={`btn btn-sm ${btnClass}`} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner loading-xs" /> : confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
}
