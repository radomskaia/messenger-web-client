import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { App } from './App';

beforeEach(() => {
  useAuthStore.setState({ credentials: null });
});

describe('App', () => {
  it('shows the login page when there are no credentials', () => {
    renderWithProviders(<App />);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the chat page once credentials exist', () => {
    useAuthStore.setState({
      credentials: {
        idInstance: '1',
        apiTokenInstance: 't',
        apiUrl: 'https://api.green-api.com',
      },
    });
    renderWithProviders(<App />);

    expect(screen.getByRole('button', { name: 'signOut' })).toBeInTheDocument();
  });
});
