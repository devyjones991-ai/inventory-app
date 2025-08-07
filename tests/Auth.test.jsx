
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/supabaseClient.js", () => {
  return {
    supabase: {
      auth: {
        signUp: vi.fn(),
        signInWithOtp: vi.fn(),
      },
    },
  };
});

import { supabase } from "@/supabaseClient.js";
import Auth from "@/components/Auth";

describe("Auth", () => {
  beforeEach(() => {
    supabase.auth.signUp.mockReset();
    supabase.auth.signInWithOtp.mockReset();
  });

  it("renders login form and toggles to registration", () => {
    render(<Auth />);
    expect(screen.getByText("Вход")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Имя пользователя")).toBeNull();

    fireEvent.click(screen.getByText("Нет аккаунта? Регистрация"));
    expect(screen.getByText("Регистрация")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Имя пользователя")).toBeInTheDocument();
  });


  it('submits login and shows errors', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: { message: 'Invalid email' } });
    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await screen.findByText('Invalid email');
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('submits registration data and shows success', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null });
    render(<Auth />);
    fireEvent.click(screen.getByText('Нет аккаунта? Регистрация'));
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Имя пользователя'), { target: { value: 'tester' } });
    fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

  it("submits login and shows errors", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });
    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Пароль"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await screen.findByText("Invalid credentials");
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
    });
  });

  it("submits registration data", async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null });
    render(<Auth />);
    fireEvent.click(screen.getByText("Нет аккаунта? Регистрация"));
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Имя пользователя"), {
      target: { value: "tester" },
    });
    fireEvent.change(screen.getByPlaceholderText("Пароль"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }));


    await screen.findByText('Письмо отправлено. Проверьте почту.');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({

      email: 'a@b.com',
      options: { data: { username: 'tester' } },

      email: "a@b.com",
      password: "123456",
      options: { data: { username: "tester" } },

    });
  });
});
