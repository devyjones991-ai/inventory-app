import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/notifications', () => ({
  requestNotificationPermission: vi.fn(),
  pushNotification: vi.fn(),
  playTaskSound: vi.fn(),
  playMessageSound: vi.fn(),
}));

vi.mock('@/supabaseClient.js', () => {
  const channelMock = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
  return {
    supabase: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  };
});

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

import App from '@/App';

describe('App', () => {
  it('отображает страницу авторизации по /auth', async () => {
    window.history.pushState({}, '', '/auth');
    render(<App />);
    expect(await screen.findByText('Вход')).toBeInTheDocument();
  });
});
