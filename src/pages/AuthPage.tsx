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
import { t } from "../i18n";
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
          setInfo("Не удалось создать сессию. Попробуйте позже.");
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
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ParticlesAnimation />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isRegister ? "Регистрация" : "Вход"}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isRegister
                  ? "Создайте аккаунт для доступа к системе"
                  : "Войдите в свой аккаунт"}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Введите email"
                  className="w-full"
                />
                <FormError error={errors.email?.message} />
              </div>

              {isRegister && (
                <div>
                  <Input
                    {...register("username")}
                    type="text"
                    placeholder="Введите имя пользователя"
                    className="w-full"
                  />
                  <FormError error={errors.username?.message} />
                </div>
              )}

              <div>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Введите пароль"
                  className="w-full"
                />
                <FormError error={errors.password?.message} />
              </div>

              {isRegister && (
                <div>
                  <Input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="Подтвердите пароль"
                    className="w-full"
                  />
                  <FormError error={errors.confirmPassword?.message} />
                </div>
              )}

              {userError && (
                <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {userError}
                  </p>
                </div>
              )}

              {info && (
                <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {info}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? "Загрузка..."
                  : isRegister
                    ? "Зарегистрироваться"
                    : "Войти"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={toggleMode}
              >
                {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}
              </Button>

              {!isRegister && (
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Забыли пароль?
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}
