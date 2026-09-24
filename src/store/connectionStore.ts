import { create } from 'zustand';

import type { ConnectionStatus } from '@/domain/types';

interface ConnectionState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

export const useConnectionStore = create<ConnectionState>()((set) => ({
  status: 'idle',
  setStatus: (status) => {
    set({ status });
  },
}));
