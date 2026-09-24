import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAutoHideScrollbar } from './useAutoHideScrollbar';

function Scroller() {
  // eslint-disable-next-line unicorn/name-replacements
  const ref = useAutoHideScrollbar<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-testid="scroller"
    />
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAutoHideScrollbar', () => {
  it('marks the element while scrolling', () => {
    render(<Scroller />);
    const element = screen.getByTestId('scroller');

    fireEvent.scroll(element);

    expect(element.dataset['scrolling']).toBe('true');
  });

  it('unmarks the element after scrolling stops', () => {
    render(<Scroller />);
    const element = screen.getByTestId('scroller');

    fireEvent.scroll(element);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(element.dataset['scrolling']).toBeUndefined();
  });
});
