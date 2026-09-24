import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useToastStore } from './toastStore';

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.getState().reset();
});

afterEach(() => {
  // Clear any pending dismiss timers before restoring real timers.
  for (const toast of useToastStore.getState().toasts) {
    useToastStore.getState().dismiss(toast.id);
  }

  vi.useRealTimers();
});

describe('toastStore', () => {
  it('shows a toast for a message key', () => {
    useToastStore.getState().push('toast.tooManyRequests');

    expect(useToastStore.getState().toasts).toEqual([
      { id: 'toast.tooManyRequests', messageKey: 'toast.tooManyRequests' },
    ]);
  });

  it('dismisses the toast on its own after the timeout', () => {
    useToastStore.getState().push('toast.tooManyRequests');
    vi.advanceTimersByTime(5000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('keeps a single toast for repeated pushes of the same key', () => {
    useToastStore.getState().push('toast.tooManyRequests');
    useToastStore.getState().push('toast.tooManyRequests');

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('refreshes the timer on a repeated push so it lives the full timeout again', () => {
    useToastStore.getState().push('toast.tooManyRequests');
    vi.advanceTimersByTime(2000);
    // Re-push before the first timer fires: the toast should survive another 2s.
    useToastStore.getState().push('toast.tooManyRequests');
    vi.advanceTimersByTime(2000);

    expect(useToastStore.getState().toasts).toHaveLength(1);

    // Well past any single timeout from the last push → it dismisses itself.
    vi.advanceTimersByTime(10_000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('dismisses on demand', () => {
    useToastStore.getState().push('toast.tooManyRequests');
    useToastStore.getState().dismiss('toast.tooManyRequests');

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
