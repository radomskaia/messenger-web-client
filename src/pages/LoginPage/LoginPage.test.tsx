import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { LoginPage } from './LoginPage';

beforeEach(() => {
  useAuthStore.setState({ credentials: null });
});

describe('LoginPage', () => {
  it('rejects an empty submission without signing in', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(useAuthStore.getState().credentials).toBeNull();
  });

  it('explains why an empty submission was rejected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Fill in both fields');
  });

  it('signs in with the entered credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('idInstance'), '1101000001');
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(useAuthStore.getState().credentials).toEqual({
      idInstance: '1101000001',
      apiTokenInstance: 'token123',
      apiUrl: 'https://api.green-api.com',
    });
  });

  it('trims surrounding whitespace from the credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('idInstance'), '  1101000001  ');
    await user.type(screen.getByLabelText('apiTokenInstance'), ' token123 ');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(useAuthStore.getState().credentials?.idInstance).toBe('1101000001');
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
});
