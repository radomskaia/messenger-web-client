import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GreenApiError, NetworkError } from '@/api/errors';
import * as methods from '@/api/methods';
import type { Credentials } from '@/domain/types';
import { startPolling } from '@/services/notificationPolling';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';
import { configuredInstanceSettings } from '@/test/instanceSettings';
import { renderWithProviders } from '@/test/renderWithProviders';

import { App } from './App';

const credentials: Credentials = {
  idInstance: '1',
  apiTokenInstance: 't',
  apiUrl: 'https://api.green-api.com',
};

/** A session read back from localStorage, not yet checked in this tab. */
function restoreSession() {
  useAuthStore.setState({ credentials, isVerified: false });
}

function stopPolling(): void {
  // No real loop is ever started against this test double, so there is
  // nothing to stop; the lifecycle hook still needs a cleanup function shape.
}

vi.mock('@/services/notificationPolling', () => ({
  startPolling: vi.fn(() => stopPolling),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // The chat list loads before polling starts; keep that off the live API.
  vi.spyOn(methods, 'getChatList').mockResolvedValue([]);
  useAuthStore.setState({ credentials: null, isVerified: false });
  useChatsStore.getState().reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('shows the login page when there are no credentials', () => {
    renderWithProviders(<App />);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the chat page right after signing in, without checking again', () => {
    const getSettings = vi.spyOn(methods, 'getSettings');
    useAuthStore.setState({ credentials, isVerified: true });
    renderWithProviders(<App />);

    expect(screen.getByRole('button', { name: 'New chat' })).toBeInTheDocument();
    expect(getSettings).not.toHaveBeenCalled();
  });

  it('checks a restored session before showing the chat page', async () => {
    const getSettings = vi
      .spyOn(methods, 'getSettings')
      .mockResolvedValue(configuredInstanceSettings);
    restoreSession();
    renderWithProviders(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Checking your GREEN-API instance',
    );
    expect(screen.queryByRole('button', { name: 'New chat' })).not.toBeInTheDocument();

    expect(await screen.findByRole('button', { name: 'New chat' })).toBeInTheDocument();
    expect(getSettings).toHaveBeenCalledWith(credentials, expect.anything());
    expect(useAuthStore.getState().isVerified).toBe(true);
  });

  it('signs out when GREEN-API no longer accepts the restored credentials', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(
      new GreenApiError(401, 'Unauthorized'),
    );
    restoreSession();
    renderWithProviders(<App />);

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(useAuthStore.getState().credentials).toBeNull();
    // Otherwise the user lands on an empty form with no idea why.
    expect(screen.getByRole('alert')).toHaveTextContent(
      'GREEN-API rejected these credentials',
    );
  });

  it('signs out when the user keeps a webhook url set elsewhere since', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configuredInstanceSettings,
      webhookUrl: 'https://crm.test/hook',
    });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();
    restoreSession();
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(await screen.findByRole('button', { name: 'Keep it there' }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(setSettings).not.toHaveBeenCalled();
    expect(useAuthStore.getState().credentials).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Messages keep going to the other address',
    );
  });

  it('keeps the session through a network failure and lets the user retry', async () => {
    vi.spyOn(methods, 'getSettings')
      .mockRejectedValueOnce(new NetworkError(new TypeError('Failed to fetch')))
      .mockResolvedValue(configuredInstanceSettings);
    restoreSession();
    const user = userEvent.setup();
    renderWithProviders(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach GREEN-API',
    );
    expect(useAuthStore.getState().credentials).toEqual(credentials);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'New chat' })).toBeInTheDocument();
  });

  it('lets the user sign out instead of retrying', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(new Error('boom'));
    restoreSession();
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(useAuthStore.getState().credentials).toBeNull();
    // Signing out by choice is not a failure the login page should explain.
    expect(useAuthStore.getState().signOutReason).toBeNull();
  });

  it('cancels the first check when StrictMode mounts the app twice', () => {
    const signals: (AbortSignal | undefined)[] = [];
    vi.spyOn(methods, 'getSettings').mockImplementation((_credentials, options) => {
      signals.push(options?.signal);

      return new Promise(() => {
        // Stays in flight: only the signal says what happened to it.
      });
    });
    restoreSession();
    // Rendered the way main.tsx does it. Wrapping StrictMode in I18nextProvider,
    // as renderWithProviders does, hides the second mount this test is about.
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(signals.map((signal) => signal?.aborted)).toEqual([true, false]);
  });

  it('cancels the check when the session ends before it finishes', () => {
    let signal: AbortSignal | undefined;
    vi.spyOn(methods, 'getSettings').mockImplementation((_credentials, options) => {
      signal = options?.signal;

      return new Promise(() => {
        // Stays in flight until the sign out below cancels it.
      });
    });
    restoreSession();
    renderWithProviders(<App />);

    act(() => {
      useAuthStore.getState().signOut();
    });

    expect(signal?.aborted).toBe(true);
  });

  it('starts polling right after signing in', async () => {
    useAuthStore.setState({ credentials, isVerified: true });
    renderWithProviders(<App />);

    await waitFor(() => {
      expect(vi.mocked(startPolling)).toHaveBeenCalled();
    });
  });

  it('does not poll a restored session until the instance check passes', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue(configuredInstanceSettings);
    restoreSession();
    renderWithProviders(<App />);

    // getSettings has not answered yet, so the check is still running.
    expect(vi.mocked(startPolling)).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(vi.mocked(startPolling)).toHaveBeenCalled();
    });
  });

  it('does not poll without credentials', () => {
    renderWithProviders(<App />);

    expect(vi.mocked(startPolling)).not.toHaveBeenCalled();
  });
});
