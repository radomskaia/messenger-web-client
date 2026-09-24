import { create } from 'zustand';

const TOAST_TIMEOUT_MS = 3000;

export interface Toast {
  id: string;
  messageKey: string;
}

interface ToastState {
  toasts: readonly Toast[];
  push: (messageKey: string) => void;
  dismiss: (id: string) => void;
  reset: () => void;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  push: (messageKey) => {
    const existing = timers.get(messageKey);

    if (existing === undefined) {
      set((state) => ({ toasts: [...state.toasts, { id: messageKey, messageKey }] }));
    } else {
      clearTimeout(existing);
    }

    timers.set(
      messageKey,
      setTimeout(() => {
        get().dismiss(messageKey);
      }, TOAST_TIMEOUT_MS),
    );
  },

  dismiss: (id) => {
    const timer = timers.get(id);

    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }

    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },

  reset: () => {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }

    timers.clear();
    set({ toasts: [] });
  },
}));
