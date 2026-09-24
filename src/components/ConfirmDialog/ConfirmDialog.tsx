import { useEffect, useId, useRef } from 'react';

import styles from './ConfirmDialog.module.css';

import type { ReactNode } from 'react';

export interface ConfirmOptions {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
}

interface ConfirmDialogProperties extends ConfirmOptions {
  onResult: (isConfirmed: boolean) => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onResult,
}: ConfirmDialogProperties) {
  const titleId = useId();
  // eslint-disable-next-line unicorn/name-replacements
  const dialogRef = useRef<HTMLDialogElement>(null);
  // eslint-disable-next-line unicorn/name-replacements
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    dialog?.showModal();
    cancelRef.current?.focus();

    return () => {
      dialog?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles['dialog']}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onResult(false);
      }}
    >
      <h2
        id={titleId}
        className={styles['title']}
      >
        {title}
      </h2>
      <div className={styles['body']}>{body}</div>
      <div className={styles['actions']}>
        <button
          ref={cancelRef}
          className={styles['cancel']}
          type="button"
          onClick={() => {
            onResult(false);
          }}
        >
          {cancelLabel}
        </button>
        <button
          className={styles['confirm']}
          type="button"
          onClick={() => {
            onResult(true);
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
