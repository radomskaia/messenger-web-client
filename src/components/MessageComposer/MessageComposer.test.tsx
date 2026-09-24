import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as methods from '@/api/methods';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { MessageComposer } from './MessageComposer';

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

describe('MessageComposer', () => {
  it('sends the typed text on Enter', async () => {
    const user = userEvent.setup();
    const send = vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'R' });
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.type(screen.getByRole('textbox'), 'hello{Enter}');

    expect(send).toHaveBeenCalledWith(expect.anything(), {
      chatId: '10',
      message: 'hello',
    });
  });

  it('clears the field after sending', async () => {
    const user = userEvent.setup();
    vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'R' });
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.type(screen.getByRole('textbox'), 'hello{Enter}');

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('inserts a newline on Shift+Enter instead of sending', async () => {
    const user = userEvent.setup();
    const send = vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'R' });
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.type(screen.getByRole('textbox'), 'line{Shift>}{Enter}{/Shift}two');

    expect(send).not.toHaveBeenCalled();
  });

  it('refuses to send whitespace only', async () => {
    const user = userEvent.setup();
    const send = vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'R' });
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.type(screen.getByRole('textbox'), '   {Enter}');

    expect(send).not.toHaveBeenCalled();
  });

  it('disables Send and counts the overflow in red for an over-limit message', async () => {
    const user = userEvent.setup();
    const send = vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'R' });
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.click(screen.getByRole('textbox'));
    await user.paste('x'.repeat(5800));

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('5800/4096');

    await user.keyboard('{Enter}');
    expect(send).not.toHaveBeenCalled();
  });

  it('shows the counter as the message nears the limit, not before', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.click(screen.getByRole('textbox'));
    await user.paste('x'.repeat(3000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.paste('x'.repeat(1000));
    expect(screen.getByRole('status')).toHaveTextContent('4000/4096');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('gives the draft back when the send fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(methods, 'sendMessage').mockRejectedValue(new Error('offline'));
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.type(screen.getByRole('textbox'), 'hello{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('hello');
    });
  });

  it('grows the field to fit what is typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessageComposer chatId="10" />);
    const field = screen.getByRole('textbox');

    // jsdom does no layout, so stand in for the height a paragraph would need.
    Object.defineProperty(field, 'scrollHeight', { value: 84, configurable: true });
    await user.type(field, 'a few\nlines\nof text');

    expect(field.style.height).toBe('84px');
  });

  it('does not send the same message twice on a fast double Enter', async () => {
    const user = userEvent.setup();
    const send = vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'R' });
    renderWithProviders(<MessageComposer chatId="10" />);

    await user.type(screen.getByRole('textbox'), 'hello{Enter}{Enter}');

    expect(send).toHaveBeenCalledTimes(1);
  });
});
