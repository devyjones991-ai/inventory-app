import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

vi.mock('../src/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        updateUser: async ({ data }) => {
          const res = await fetch('https://example.supabase.co/auth/v1/user', {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
          });
          const json = await res.json();
          return { data: { user: json.user }, error: null };
        },
      },
    },
  };
});

import AccountModal from '../src/components/AccountModal';

const updatedUser = { id: '1', user_metadata: { username: 'newnick' } };

const server = setupServer(
  http.put('*/auth/v1/user', () => HttpResponse.json({ user: updatedUser })),
  http.patch('*/auth/v1/user', () => HttpResponse.json({ user: updatedUser })),
  http.post('*/auth/v1/user', () => HttpResponse.json({ user: updatedUser }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AccountModal', () => {
  it('updates nickname and closes modal', async () => {
    const onClose = vi.fn();
    const onUpdated = vi.fn();
    const user = { id: '1', user_metadata: { username: 'oldnick' } };

    function Wrapper() {
      const [open, setOpen] = React.useState(true);
      return open ? (
        <AccountModal
          user={user}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          onUpdated={onUpdated}
        />
      ) : null;
    }

    render(<Wrapper />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'newnick' },
    });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(updatedUser);
      expect(onClose).toHaveBeenCalled();
    });

    await waitFor(() =>
      expect(screen.queryByText('Редактирование аккаунта')).toBeNull()
    );
  });
});
