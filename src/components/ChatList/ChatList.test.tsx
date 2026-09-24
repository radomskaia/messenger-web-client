import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useChatsStore } from '@/store/chatsStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { ChatList } from './ChatList';

beforeEach(() => {
  useChatsStore.getState().reset();
});

describe('ChatList', () => {
  it('tells the user there is nothing yet', () => {
    renderWithProviders(<ChatList />);

    expect(
      screen.getByText('No chats yet. Start one with a phone number.'),
    ).toBeInTheDocument();
  });

  it('renders a chat title', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 1 }]);
    renderWithProviders(<ChatList />);

    expect(screen.getByRole('button', { name: /Ivan/u })).toBeInTheDocument();
  });

  it('orders chats by most recent activity', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Older', lastMessageAt: 1 }]);
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '11', name: 'Newer', lastMessageAt: 2 }]);
    renderWithProviders(<ChatList />);

    const titles = screen.getAllByRole('button').map((button) => button.textContent);

    expect(titles[0]).toContain('Newer');
  });

  it('activates the chat that was clicked', async () => {
    const user = userEvent.setup();
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 1 }]);
    renderWithProviders(<ChatList />);

    await user.click(screen.getByRole('button', { name: /Ivan/u }));

    expect(useChatsStore.getState().activeChatId).toBe('10');
  });

  it('tells assistive technology which chat is active and which are not', async () => {
    const user = userEvent.setup();
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 2 }]);
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '11', name: 'Olga', lastMessageAt: 1 }]);
    renderWithProviders(<ChatList />);

    await user.click(screen.getByRole('button', { name: /Ivan/u }));

    expect(screen.getByRole('button', { name: /Ivan/u })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: /Olga/u })).toHaveAttribute(
      'aria-current',
      'false',
    );
  });

  it('keeps an emoji initial whole instead of splitting a surrogate pair', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: '🎉 Party', lastMessageAt: 1 }]);
    renderWithProviders(<ChatList />);

    expect(screen.getByText('🎉')).toBeInTheDocument();
  });
});
