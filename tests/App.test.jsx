import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/utils/notifications', () => ({
  requestNotificationPermission: vi.fn(),
  pushNotification: vi.fn(),
  playTaskSound: vi.fn(),
  playMessageSound: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

import App from '../src/App';

describe('App', () => {
  it('renders App without crashing', async () => {
    render(<App />);
    expect(await screen.findByText('Вход')).toBeInTheDocument();
  });
});
