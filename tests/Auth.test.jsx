import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../src/supabaseClient.js';
import Auth from '../src/components/Auth';

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form and toggles to registration', () => {
    render(<Auth />);
    expect(screen.getByText('Вход')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Имя пользователя')).toBeNull();

    fireEvent.click(screen.getByText('Нет аккаунта? Регистрация'));
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Имя пользователя')).toBeInTheDocument();
  });

  it('submits login and shows errors', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({ error: { message: 'Invalid credentials' } });
    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await screen.findByText('Invalid credentials');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: '123456' });
  });

  it('submits registration data', async () => {
    vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({ error: null });
    render(<Auth />);
    fireEvent.click(screen.getByText('Нет аккаунта? Регистрация'));
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Имя пользователя'), { target: { value: 'tester' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    await waitFor(() => expect(supabase.auth.signUp).toHaveBeenCalled());
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: '123456',
      options: { data: { username: 'tester' } },
    });
  });
});
