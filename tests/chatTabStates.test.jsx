import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const user = { user_metadata: { username: 'Tester' }, email: 'test@example.com' };
const selected = { id: 'object1' };

describe('ChatTab state display', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows spinner while loading', async () => {
    vi.doMock('../src/utils/useSupabaseQuery', () => ({
      useSupabaseQuery: () => ({ data: null, isLoading: true, isError: null })
    }));
    vi.doMock('../src/supabaseClient.js', () => ({
      supabase: { channel: () => ({ on: () => ({ subscribe: () => {} }) }), removeChannel: () => {} }
    }));
    const ChatTab = (await import('../src/components/ChatTab.jsx')).default;
    render(<ChatTab selected={selected} user={user} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    vi.doMock('../src/utils/useSupabaseQuery', () => ({
      useSupabaseQuery: () => ({ data: null, isLoading: false, isError: new Error('fail') })
    }));
    vi.doMock('../src/supabaseClient.js', () => ({
      supabase: { channel: () => ({ on: () => ({ subscribe: () => {} }) }), removeChannel: () => {} }
    }));
    const ChatTab = (await import('../src/components/ChatTab.jsx')).default;
    render(<ChatTab selected={selected} user={user} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ошибка загрузки сообщений');
  });
});
