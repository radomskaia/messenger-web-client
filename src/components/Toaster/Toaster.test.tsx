import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { useToastStore } from '@/store/toastStore';
import { renderWithProviders } from '@/test/renderWithProviders';

import { Toaster } from './Toaster';

afterEach(() => {
  useToastStore.getState().reset();
});

describe('Toaster', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = renderWithProviders(<Toaster />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a pushed toast in the current language', () => {
    useToastStore.getState().push('toast.tooManyRequests');
    renderWithProviders(<Toaster />);

    expect(screen.getByText('Too many requests, try again')).toBeInTheDocument();
  });

  it('lets the user dismiss a toast by clicking it', async () => {
    const user = userEvent.setup();
    useToastStore.getState().push('toast.tooManyRequests');
    renderWithProviders(<Toaster />);

    await user.click(screen.getByText('Too many requests, try again'));

    expect(screen.queryByText('Too many requests, try again')).not.toBeInTheDocument();
  });
});
