import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18next } from '@/app/i18n';
import type { Message } from '@/domain/types';
import { MESSAGES_PER_CHAT_LIMIT, useChatsStore } from '@/store/chatsStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { MessageList } from './MessageList';

import type { ReactElement } from 'react';

// rerender() replaces the whole previously rendered tree, so the provider must be
// included again on every call or React sees a different root element type and
// remounts everything — which would make every scroll assertion below vacuous.
const rect = (top: number, bottom: number): DOMRect =>
  ({
    top,
    bottom,
    left: 0,
    right: 0,
    width: 0,
    height: bottom - top,
    x: 0,
    y: top,
  }) as DOMRect;

function withProviders(ui: ReactElement) {
  return <I18nextProvider i18n={i18next}>{ui}</I18nextProvider>;
}

function message(overrides: Partial<Message> = {}): Message {
  return {
    idMessage: 'A',
    chatId: '10',
    direction: 'incoming',
    text: 'hello',
    timestamp: 1_763_115_112_000,
    status: 'sent',
    ...overrides,
  };
}

beforeEach(() => {
  useChatsStore.getState().reset();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('MessageList', () => {
  it('renders the message text', () => {
    useChatsStore.getState().addMessage(message());
    renderWithProviders(<MessageList chatId="10" />);

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('tells the reader who sent each message', () => {
    useChatsStore.getState().addMessage(message({ idMessage: 'A', timestamp: 1 }));
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'B', direction: 'outgoing', timestamp: 2 }));
    renderWithProviders(<MessageList chatId="10" />);

    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('marks a failed message so it cannot be mistaken for delivered', () => {
    useChatsStore
      .getState()
      .addMessage(message({ direction: 'outgoing', status: 'failed' }));
    renderWithProviders(<MessageList chatId="10" />);

    expect(screen.getByText('Not sent')).toBeInTheDocument();
  });

  it('renders nothing but the empty list for an unknown chat', () => {
    renderWithProviders(<MessageList chatId="missing" />);

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('scrolls again when a new message arrives without changing the count', () => {
    // Fill the chat to the 200-message cap first: from here, addMessage's own
    // atomic drop-the-oldest behaviour means the array length never changes
    // again, exactly like the real cap in a long-running chat.
    for (let index = 0; index < MESSAGES_PER_CHAT_LIMIT; index += 1) {
      useChatsStore
        .getState()
        .addMessage(message({ idMessage: `id-${String(index)}`, timestamp: index }));
    }

    const { rerender } = renderWithProviders(<MessageList chatId="10" />);
    const scroll = screen.getByTestId('message-scroll');
    // Stand in for a tall thread; the list keeps the container pinned to the end.
    Object.defineProperty(scroll, 'scrollHeight', { value: 1000, configurable: true });

    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'newest', timestamp: MESSAGES_PER_CHAT_LIMIT }));
    rerender(withProviders(<MessageList chatId="10" />));

    expect(useChatsStore.getState().messages['10']).toHaveLength(MESSAGES_PER_CHAT_LIMIT);
    expect(scroll.scrollTop).toBe(1000);
  });

  it('reveals the to-bottom button only once scrolling pauses away from the bottom', () => {
    vi.useFakeTimers();

    try {
      useChatsStore.getState().addMessage(message());
      renderWithProviders(<MessageList chatId="10" />);
      const scroll = screen.getByTestId('message-scroll');
      const buttonName = 'Scroll to the latest messages';

      // jsdom reports zero for every layout metric, so stand in for a tall thread
      // the user has scrolled up in.
      Object.defineProperties(scroll, {
        scrollHeight: { value: 1000, configurable: true },
        clientHeight: { value: 400, configurable: true },
        scrollTop: { value: 100, configurable: true, writable: true },
      });
      fireEvent.scroll(scroll);

      // While scrolling and before the pause elapses, the button stays hidden.
      expect(screen.queryByRole('button', { name: buttonName })).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByRole('button', { name: buttonName })).toBeInTheDocument();

      // Scrolling again hides it at once, before any new pause.
      fireEvent.scroll(scroll);
      expect(screen.queryByRole('button', { name: buttonName })).not.toBeInTheDocument();

      // A pause at the bottom leaves it hidden.
      Object.defineProperty(scroll, 'scrollTop', { value: 600, configurable: true });
      fireEvent.scroll(scroll);
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.queryByRole('button', { name: buttonName })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-pins to the bottom when older history loads in above the view', () => {
    // The chat opens showing only the live messages, then history for it
    // arrives and is merged in ahead of them (older timestamps). The newest
    // message — and so the list's last id — is unchanged by that prepend.
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'live', chatId: '10', timestamp: 100 }));
    const { rerender } = renderWithProviders(<MessageList chatId="10" />);
    const scroll = screen.getByTestId('message-scroll');
    // Prepending older messages makes the thread tall enough to scroll.
    Object.defineProperty(scroll, 'scrollHeight', { value: 1000, configurable: true });

    useChatsStore
      .getState()
      .addMessages([
        message({ idMessage: 'old-1', chatId: '10', timestamp: 1 }),
        message({ idMessage: 'old-2', chatId: '10', timestamp: 2 }),
      ]);
    rerender(withProviders(<MessageList chatId="10" />));

    expect(scroll.scrollTop).toBe(1000);
  });

  it('scrolls when switching to a chat with the same message count', () => {
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'A', chatId: '10', timestamp: 1 }));
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'B', chatId: '20', timestamp: 1 }));
    const { rerender } = renderWithProviders(<MessageList chatId="10" />);
    const scroll = screen.getByTestId('message-scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 1000, configurable: true });

    rerender(withProviders(<MessageList chatId="20" />));

    expect(scroll.scrollTop).toBe(1000);
  });

  it('draws the unread divider before the first unread message', () => {
    useChatsStore
      .getState()
      .addMessages([
        message({ idMessage: 'a', chatId: '10', timestamp: 1 }),
        message({ idMessage: 'b', chatId: '10', timestamp: 2 }),
      ]);
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().setActiveChat('10');
    renderWithProviders(<MessageList chatId="10" />);

    expect(screen.getByText('Unread messages')).toBeInTheDocument();
  });

  it('dismisses the divider once it scrolls out of view', () => {
    useChatsStore
      .getState()
      .addMessages([
        message({ idMessage: 'a', chatId: '10', timestamp: 1 }),
        message({ idMessage: 'b', chatId: '10', timestamp: 2 }),
      ]);
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().setActiveChat('10');
    renderWithProviders(<MessageList chatId="10" />);
    const scroll = screen.getByTestId('message-scroll');
    const divider = screen.getByText('Unread messages');

    // Container occupies 0–400; the divider sits below it, out of view.
    scroll.getBoundingClientRect = () => rect(0, 400);
    divider.getBoundingClientRect = () => rect(500, 520);
    fireEvent.scroll(scroll);

    expect(useChatsStore.getState().unreadDivider).toBeNull();
  });

  it('shows the history loader while the chat history is loading', () => {
    useChatsStore.getState().addMessage(message({ chatId: '10' }));
    useChatsStore.getState().setHistoryLoading('10', true);
    renderWithProviders(<MessageList chatId="10" />);

    expect(screen.getByRole('status', { name: 'Loading history' })).toBeInTheDocument();
  });

  it('hides the history loader once loading finishes', () => {
    useChatsStore.getState().addMessage(message({ chatId: '10' }));
    renderWithProviders(<MessageList chatId="10" />);

    expect(
      screen.queryByRole('status', { name: 'Loading history' }),
    ).not.toBeInTheDocument();
  });

  it('marks the chat read once the bottom is reached', () => {
    vi.useFakeTimers();

    try {
      useChatsStore.getState().addMessage(message({ chatId: '10' }));
      useChatsStore.getState().incrementUnread('10');
      renderWithProviders(<MessageList chatId="10" />);
      const scroll = screen.getByTestId('message-scroll');

      // jsdom reports zero metrics, i.e. already at the bottom.
      fireEvent.scroll(scroll);
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(useChatsStore.getState().unread['10']).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
