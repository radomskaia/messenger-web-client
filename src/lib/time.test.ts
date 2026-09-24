import { describe, expect, it } from 'vitest';

import { delay, formatTime } from './time';

describe('delay', () => {
  it('resolves after the requested time', async () => {
    const started = Date.now();

    await delay(20);

    expect(Date.now() - started).toBeGreaterThanOrEqual(15);
  });

  it('resolves immediately when the signal is already aborted', async () => {
    const controller = new AbortController();

    controller.abort();
    const started = Date.now();
    await delay(5000, controller.signal);

    expect(Date.now() - started).toBeLessThan(100);
  });

  it('resolves early when the signal aborts during the wait', async () => {
    const controller = new AbortController();
    const started = Date.now();

    setTimeout(() => {
      controller.abort();
    }, 10);
    await delay(5000, controller.signal);

    expect(Date.now() - started).toBeLessThan(200);
  });
});

describe('formatTime', () => {
  it('formats a timestamp as hours and minutes', () => {
    expect(formatTime(Date.UTC(2026, 0, 1, 12, 30), 'en-GB')).toMatch(/^\d{2}:\d{2}$/u);
  });
});
