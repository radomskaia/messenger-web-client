import { useCallback, useState } from 'react';

import { ConfirmDialog } from './ConfirmDialog';

import type { ConfirmOptions } from './ConfirmDialog';

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (isConfirmed: boolean) => void;
}

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ options, resolve });
      }),
    [],
  );

  const dialog =
    pending === null ? null : (
      <ConfirmDialog
        {...pending.options}
        onResult={(isConfirmed) => {
          pending.resolve(isConfirmed);
          setPending(null);
        }}
      />
    );

  return { dialog, confirm };
}
