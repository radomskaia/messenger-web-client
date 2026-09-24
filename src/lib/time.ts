export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    // A listener attached to an already-aborted signal never fires, so this
    // synchronous check is the only thing that stops a full-length wait.
    if (signal?.aborted === true) {
      resolve();

      return;
    }

    const timer = setTimeout(finish, ms);

    function finish(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', finish);
      resolve();
    }

    signal?.addEventListener('abort', finish, { once: true });
  });
}

export function formatTime(timestamp: number, locale: string): string {
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
