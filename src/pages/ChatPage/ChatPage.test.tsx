import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatsStore } from '@/store/chatsStore';
import { useConnectionStore } from '@/store/connectionStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { ChatPage } from './ChatPage';

beforeEach(() => {
  useChatsStore.getState().reset();
  useConnectionStore.setState({ status: 'online' });
  // jsdom does not implement scrollIntoView; MessageList calls it on mount.
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('ChatPage', () => {
  it('prompts the user to pick a chat when none is active', () => {
    renderWithProviders(<ChatPage />);

    expect(screen.getByText('Select a chat to start messaging')).toBeInTheDocument();
  });

  it('shows the composer once a chat is active', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 1 }]);
    useChatsStore.getState().setActiveChat('10');
    renderWithProviders(<ChatPage />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('opens the new chat dialog from the sidebar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'New chat' }));

    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
  });

  it('surfaces the reconnecting state', () => {
    useConnectionStore.setState({ status: 'reconnecting' });
    renderWithProviders(<ChatPage />);

    expect(screen.getByText('Reconnecting…')).toBeInTheDocument();
  });

  it('falls back to the placeholder when the active chat no longer exists', () => {
    useChatsStore.getState().setActiveChat('ghost');
    renderWithProviders(<ChatPage />);

    expect(screen.getByText('Select a chat to start messaging')).toBeInTheDocument();
  });

  it('leaves the active chat when Escape is pressed', async () => {
    const user = userEvent.setup();
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 1 }]);
    useChatsStore.getState().setActiveChat('10');
    renderWithProviders(<ChatPage />);

    await user.keyboard('{Escape}');

    expect(useChatsStore.getState().activeChatId).toBeNull();
    expect(screen.getByText('Select a chat to start messaging')).toBeInTheDocument();
  });

  it('leaves the active chat with the header back button', async () => {
    const user = userEvent.setup();
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 1 }]);
    useChatsStore.getState().setActiveChat('10');
    renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'Back to chats' }));

    expect(useChatsStore.getState().activeChatId).toBeNull();
    expect(screen.getByText('Select a chat to start messaging')).toBeInTheDocument();
  });

  it('ignores Escape when no chat is open', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />);

    // Nothing to throw: with no active chat, Escape must be a no-op.
    await user.keyboard('{Escape}');

    expect(useChatsStore.getState().activeChatId).toBeNull();
  });

  it('does not render the composer when no chat is active', () => {
    renderWithProviders(<ChatPage />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
