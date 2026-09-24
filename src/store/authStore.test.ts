import { beforeEach, describe, expect, it } from 'vitest';

import type { Credentials } from '@/domain/types';
import { useChatsStore } from '@/store/chatsStore';

import { useAuthStore } from './authStore';

const credentials: Credentials = {
  idInstance: '1101000001',
  apiTokenInstance: 'token123',
  apiUrl: 'https://api.green-api.com',
};

beforeEach(() => {
  useAuthStore.setState({ credentials: null, isVerified: false, signOutReason: null });
  useChatsStore.getState().reset();
  localStorage.clear();
});

describe('authStore', () => {
  it('starts signed out', () => {
    expect(useAuthStore.getState().credentials).toBeNull();
  });

  it('stores credentials on sign in', () => {
    useAuthStore.getState().signIn(credentials);

    expect(useAuthStore.getState().credentials).toEqual(credentials);
  });

  it('clears credentials on sign out', () => {
    useAuthStore.getState().signIn(credentials);
    useAuthStore.getState().signOut();

    expect(useAuthStore.getState().credentials).toBeNull();
  });

  it('clears the previous account chats and messages on sign out', () => {
    useAuthStore.getState().signIn(credentials);
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 1 }]);
    useChatsStore.getState().addMessage({
      idMessage: 'A',
      chatId: '10',
      direction: 'incoming',
      text: 'hi',
      timestamp: 1,
      status: 'sent',
    });
    useChatsStore.getState().setActiveChat('10');

    useAuthStore.getState().signOut();

    expect(useChatsStore.getState().chats).toEqual({});
    expect(useChatsStore.getState().messages).toEqual({});
    expect(useChatsStore.getState().activeChatId).toBeNull();
  });

  it('persists credentials to localStorage', () => {
    useAuthStore.getState().signIn(credentials);

    expect(localStorage.getItem('messenger:auth')).toContain('1101000001');
  });

  it('discards a persisted credentials blob of the wrong shape', async () => {
    localStorage.setItem(
      'messenger:auth',
      JSON.stringify({ state: { credentials: { idInstance: 7 } }, version: 1 }),
    );
    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().credentials).toBeNull();
  });

  it('keeps a persisted credentials blob of the right shape', async () => {
    localStorage.setItem(
      'messenger:auth',
      JSON.stringify({ state: { credentials }, version: 1 }),
    );
    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().credentials).toEqual(credentials);
  });

  it('treats a sign in as verified, since the login form checks first', () => {
    useAuthStore.getState().signIn(credentials);

    expect(useAuthStore.getState().isVerified).toBe(true);
  });

  it('does not trust a restored session until it is checked again', async () => {
    useAuthStore.getState().signIn(credentials);
    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().credentials).toEqual(credentials);
    expect(useAuthStore.getState().isVerified).toBe(false);
  });

  it('marks a restored session verified', () => {
    useAuthStore.setState({ credentials, isVerified: false });
    useAuthStore.getState().markVerified();

    expect(useAuthStore.getState().isVerified).toBe(true);
  });

  it('drops verification on sign out', () => {
    useAuthStore.getState().signIn(credentials);
    useAuthStore.getState().signOut();

    expect(useAuthStore.getState().isVerified).toBe(false);
  });

  it('records the reason passed to sign out', () => {
    useAuthStore.getState().signOut('auth.unauthorized');

    expect(useAuthStore.getState().signOutReason).toBe('auth.unauthorized');
  });

  it('clears the sign-out reason on the next sign in', () => {
    useAuthStore.getState().signOut('auth.unauthorized');
    useAuthStore.getState().signIn(credentials);

    expect(useAuthStore.getState().signOutReason).toBeNull();
  });

  it('does not persist the sign-out reason', () => {
    useAuthStore.getState().signOut('auth.unauthorized');

    const stored = localStorage.getItem('messenger:auth');

    expect(stored).not.toBeNull();
    expect(stored).not.toContain('unauthorized');
  });
});
