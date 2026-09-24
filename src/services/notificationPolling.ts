import { deleteNotification, receiveNotification } from '@/api/methods';
import type { ConnectionStatus, Credentials } from '@/domain/types';
import { delay } from '@/lib/time';

const DEFAULT_RECEIVE_TIMEOUT_SECONDS = 20;
const DEFAULT_INITIAL_BACKOFF_MS = 1000;
const DEFAULT_MAX_BACKOFF_MS = 30_000;
const BACKOFF_FACTOR = 2;

export interface PollingHandlers {
  onNotification: (body: unknown) => void;
  onConnectionChange: (status: ConnectionStatus) => void;
  onError?: (error: unknown) => void;
}

export interface PollingOptions {
  receiveTimeoutSeconds?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

function safely(action: () => void): void {
  try {
    action();
  } catch {
    // A handler that throws must not be able to stop delivery. A dead loop is
    // indistinguishable from nobody replying, which is the worst failure here.
  }
}

async function runLoop(
  credentials: Credentials,
  handlers: PollingHandlers,
  options: Required<PollingOptions>,
  signal: AbortSignal,
): Promise<void> {
  let backoff = options.initialBackoffMs;

  while (!signal.aborted) {
    try {
      const envelope = await receiveNotification(credentials, {
        receiveTimeoutSeconds: options.receiveTimeoutSeconds,
        signal,
      });

      safely(() => {
        handlers.onConnectionChange('online');
      });

      if (!envelope) {
        backoff = options.initialBackoffMs;
        await delay(0, signal);

        continue;
      }

      try {
        handlers.onNotification(envelope.body);
      } finally {
        await deleteNotification(credentials, envelope.receiptId);
      }

      backoff = options.initialBackoffMs;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (signal.aborted) {
        return;
      }

      safely(() => {
        handlers.onError?.(error);
      });
      await delay(backoff, signal);
      backoff = Math.min(backoff * BACKOFF_FACTOR, options.maxBackoffMs);
    }
  }
}

export function startPolling(
  credentials: Credentials,
  handlers: PollingHandlers,
  options: PollingOptions = {},
): () => void {
  const controller = new AbortController();
  const resolved: Required<PollingOptions> = {
    receiveTimeoutSeconds:
      options.receiveTimeoutSeconds ?? DEFAULT_RECEIVE_TIMEOUT_SECONDS,
    initialBackoffMs: options.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS,
    maxBackoffMs: options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS,
  };

  void runLoop(credentials, handlers, resolved, controller.signal).catch(() => {
    // runLoop is written never to reject. This is the last line of defence so that a
    // future change cannot turn a crash into a chat that silently stops receiving.
  });

  return () => {
    controller.abort();
  };
}
