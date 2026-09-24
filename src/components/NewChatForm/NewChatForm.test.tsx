import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as methods from '@/api/methods';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { NewChatForm } from './NewChatForm.tsx';

const noOp = () => {
  // no-op
};

beforeEach(() => {
  vi.restoreAllMocks();
  useChatsStore.getState().reset();
  useAuthStore.setState({
    credentials: {
      idInstance: '1',
      apiTokenInstance: 't',
      apiUrl: 'https://api.green-api.com',
    },
  });
});

describe('NewChatForm', () => {
  it('rejects a malformed phone number before calling the API', async () => {
    const user = userEvent.setup();
    const check = vi.spyOn(methods, 'checkAccount');
    renderWithProviders(<NewChatForm onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Phone number'), '123');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(check).not.toHaveBeenCalled();
  });

  it('shows why a malformed number was rejected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewChatForm onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Phone number'), '123');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a valid phone number',
    );
  });

  it('creates a chat with the canonical id returned by checkAccount', async () => {
    const user = userEvent.setup();
    vi.spyOn(methods, 'checkAccount').mockResolvedValue({
      exist: true,
      chatId: '10000000',
    });
    renderWithProviders(<NewChatForm onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Phone number'), '+7 900 123-45-67');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(useChatsStore.getState().chats['10000000']).toBeDefined();
    });
  });

  it('reports a number with no Telegram account', async () => {
    const user = userEvent.setup();
    vi.spyOn(methods, 'checkAccount').mockResolvedValue({ exist: false, chatId: '' });
    renderWithProviders(<NewChatForm onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Phone number'), '+7 900 123-45-67');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No Telegram account found for this number',
    );
  });

  it('closes after creating the chat', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.spyOn(methods, 'checkAccount').mockResolvedValue({
      exist: true,
      chatId: '10000000',
    });
    renderWithProviders(<NewChatForm onClose={onClose} />);

    await user.type(screen.getByLabelText('Phone number'), '+7 900 123-45-67');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not create the chat when the dialog was cancelled mid-check', async () => {
    const user = userEvent.setup();
    let resolveCheck: (value: { exist: boolean; chatId: string }) => void = noOp;

    vi.spyOn(methods, 'checkAccount').mockImplementation(
      () =>
        // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
        new Promise<{ exist: boolean; chatId: string }>((resolve) => {
          resolveCheck = resolve;
        }),
    );
    renderWithProviders(<NewChatForm onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Phone number'), '+7 900 123-45-67');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await act(async () => {
      resolveCheck({ exist: true, chatId: '10000000' });
      await Promise.resolve();
    });

    expect(useChatsStore.getState().chats['10000000']).toBeUndefined();
  });

  it('reports a failed check without creating a chat', async () => {
    const user = userEvent.setup();
    vi.spyOn(methods, 'checkAccount').mockRejectedValue(new Error('offline'));
    renderWithProviders(<NewChatForm onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Phone number'), '+7 900 123-45-67');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not check the number, try again',
    );
    expect(Object.keys(useChatsStore.getState().chats)).toHaveLength(0);
  });
});
