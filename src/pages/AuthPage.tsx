import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import ForgotPasswordModal from "../components/ForgotPasswordModal";
import FormError from "../components/FormError";
import ParticlesAnimation from "../components/ParticlesAnimation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
// import { t } from "../i18n";
import "../assets/auth-styles.css";
// import logger from "../utils/logger";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn, error: authError } = useSupabaseAuth();
  const { user, isLoading } = useAuth();

  const schema = z
    .object({
      email: z.string().email("Неверный формат email"),
      password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
      username: z.string().optional(),
      confirmPassword: z.string().optional(),
    })
    .refine(
      (data) => {
        if (isRegister && data.password !== data.confirmPassword) {
          return false;
        }
        return true;
      },
      {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
      },
    );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (authError) {
      setUserError(authError.message || "Произошла ошибка");
    }
  }, [authError]);

  const onSubmit = async (data: Record<string, unknown>) => {
    setUserError(null);
    setInfo(null);

    try {
      if (isRegister) {
        const { error } = await signUp(
          data.email,
          data.password,
          data.username,
        );
        if (error) {
          setUserError(getNetworkErrorMessage(error));
        } else {
          setInfo("Проверьте email для подтверждения регистрации");
        }
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          setUserError(getNetworkErrorMessage(error));
        } else {
          console.log("Sign in successful, navigating to /");
          // Успешный вход - перенаправляем на главную страницу
          navigate("/");
        }
      }
    } catch (error) {
      setUserError(getNetworkErrorMessage(error));
    }
  };

  const getNetworkErrorMessage = (error: unknown) => {
    if (error?.message?.includes("Failed to fetch")) {
      return "Не удалось выполнить вход. Попробуйте позже.";
    }
    return error?.message || "Произошла ошибка";
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setUserError(null);
    setInfo(null);
    reset();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="auth-page">
        <ParticlesAnimation />
        <div className="auth-container">
          <div className="text-center">
            <h1 className="auth-title">
              {isRegister ? "Регистрация" : "Вход"}
            </h1>
            <p className="auth-subtitle">
              {isRegister
                ? "Создайте аккаунт для доступа к системе"
                : "Войдите в свой аккаунт"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div>
              <input
                {...register("email")}
                type="email"
                placeholder="Введите email"
                className="auth-input"
              />
              <FormError error={errors.email?.message} />
            </div>

            {isRegister && (
              <div>
                <input
                  {...register("username")}
                  type="text"
                  placeholder="Введите имя пользователя"
                  className="auth-input"
                />
                <FormError error={errors.username?.message} />
              </div>
            )}

            <div>
              <input
                {...register("password")}
                type="password"
                placeholder="Введите пароль"
                className="auth-input"
              />
              <FormError error={errors.password?.message} />
            </div>

            {isRegister && (
              <div>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Подтвердите пароль"
                  className="auth-input"
                />
                <FormError error={errors.confirmPassword?.message} />
              </div>
            )}

            {userError && (
              <div className="auth-error">
                <p>{userError}</p>
              </div>
            )}

            {info && (
              <div className="auth-info">
                <p>{info}</p>
              </div>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Загрузка..."
                : isRegister
                  ? "Зарегистрироваться"
                  : "Войти"}
            </button>
          </form>

          <div className="auth-toggle">
            <button
              type="button"
              className="auth-toggle-button"
              onClick={toggleMode}
            >
              {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}
            </button>

            {!isRegister && (
              <div className="auth-forgot">
                <button
                  type="button"
                  className="auth-forgot-button"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Забыли пароль?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </>
  );
}
