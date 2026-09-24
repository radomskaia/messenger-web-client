import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GreenApiError, NetworkError } from '@/api/errors';
import * as methods from '@/api/methods';
import { useAuthStore } from '@/store/authStore';
import { configuredInstanceSettings } from '@/test/instanceSettings';
import { renderWithProviders } from '@/test/renderWithProviders';

import { LoginPage } from './LoginPage';

async function submitCredentials(
  idInstance = '1101000001',
  apiTokenInstance = 'token123',
) {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  await user.type(screen.getByLabelText('idInstance'), idInstance);
  await user.type(screen.getByLabelText('apiTokenInstance'), apiTokenInstance);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  return user;
}

beforeEach(() => {
  useAuthStore.setState({ credentials: null, signOutReason: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('rejects an empty submission without signing in', async () => {
    const getSettings = vi.spyOn(methods, 'getSettings');
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(useAuthStore.getState().credentials).toBeNull();
    expect(getSettings).not.toHaveBeenCalled();
  });

  it('explains why an empty submission was rejected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Fill in both fields');
  });

  it('signs in once the instance is ready', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue(configuredInstanceSettings);

    await submitCredentials();

    await waitFor(() => {
      expect(useAuthStore.getState().credentials).toEqual({
        idInstance: '1101000001',
        apiTokenInstance: 'token123',
        apiUrl: 'https://api.green-api.com',
      });
    });
  });

  it('trims surrounding whitespace from the credentials', async () => {
    const getSettings = vi
      .spyOn(methods, 'getSettings')
      .mockResolvedValue(configuredInstanceSettings);

    await submitCredentials('  1101000001  ', ' token123 ');

    await waitFor(() => {
      expect(useAuthStore.getState().credentials?.idInstance).toBe('1101000001');
    });
    expect(getSettings).toHaveBeenCalledWith(
      expect.objectContaining({ idInstance: '1101000001', apiTokenInstance: 'token123' }),
      expect.anything(),
    );
  });

  it('turns on missing notifications before signing in', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configuredInstanceSettings,
      incomingWebhook: 'no',
    });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();

    await submitCredentials();

    await waitFor(() => {
      expect(useAuthStore.getState().credentials).not.toBeNull();
    });
    expect(setSettings).toHaveBeenCalledWith(
      expect.anything(),
      { incomingWebhook: 'yes' },
      expect.anything(),
    );
  });

  it('stays signed out when GREEN-API rejects the credentials', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(
      new GreenApiError(401, 'Unauthorized'),
    );

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GREEN-API rejected these credentials',
    );
    expect(useAuthStore.getState().credentials).toBeNull();
  });

  it('tells a network failure apart from wrong credentials', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(
      new NetworkError(new TypeError('Failed to fetch')),
    );

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach GREEN-API',
    );
    expect(useAuthStore.getState().credentials).toBeNull();
  });

  it('asks before clearing a webhook url another integration uses', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configuredInstanceSettings,
      webhookUrl: 'https://crm.test/hook',
    });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();

    const user = await submitCredentials();
    const dialog = await screen.findByRole('dialog', {
      name: 'Receive messages in this app?',
    });

    expect(dialog).toHaveTextContent('https://crm.test/hook');
    expect(setSettings).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Take over' }));

    await waitFor(() => {
      expect(useAuthStore.getState().credentials).not.toBeNull();
    });
    expect(setSettings).toHaveBeenCalledWith(
      expect.anything(),
      { webhookUrl: '' },
      expect.anything(),
    );
  });

  it('stays signed out when the user keeps the existing webhook url', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configuredInstanceSettings,
      webhookUrl: 'https://crm.test/hook',
    });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();

    const user = await submitCredentials();
    await user.click(await screen.findByRole('button', { name: 'Keep it there' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Messages keep going to the other address',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(setSettings).not.toHaveBeenCalled();
    expect(useAuthStore.getState().credentials).toBeNull();
  });

  it('ignores repeated clicks while the instance is being checked', async () => {
    const getSettings = vi.spyOn(methods, 'getSettings').mockReturnValue(
      new Promise(() => {
        // Never settles: the check stays in flight for the whole test.
      }),
    );

    const user = await submitCredentials();
    await user.click(screen.getByRole('button', { name: 'Checking…' }));

    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
    expect(getSettings).toHaveBeenCalledTimes(1);
  });

  it('points to the GREEN-API console for creating an instance or finding its credentials', () => {
    renderWithProviders(<LoginPage />);

    const link = screen.getByRole('link', { name: 'GREEN-API console' });
    expect(link).toHaveAttribute('href', 'https://console.green-api.com/');
    // A new tab, so whatever is already typed into the form survives.
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('masks the api token, which is a secret typed on screen', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText('apiTokenInstance')).toHaveAttribute('type', 'password');
  });

  it('mounts a fresh alert node on a repeated failure, so it is announced again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const first = screen.getByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const second = screen.getByRole('alert');

    expect(second).not.toBe(first);
  });

  it('explains a sign-out caused by a rejected token', () => {
    useAuthStore.getState().signOut('auth.unauthorized');
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'GREEN-API rejected these credentials',
    );
  });

  it('shows only one alert when a validation error and a sign-out reason are both present', async () => {
    useAuthStore.getState().signOut('auth.unauthorized');
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Fill in both fields');
  });
});
