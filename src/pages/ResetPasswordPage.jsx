import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import FormError from "../components/FormError";
import ParticlesAnimation from "@/components/ParticlesAnimation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { t } from "@/i18n";
import { supabase } from "@/supabaseClient";
import logger from "@/utils/logger";

const schema = z
  .object({
    password: z.string().min(6, t("auth.password")),
    confirmPassword: z.string().min(6, "Подтвердите пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { error: authError } = useSupabaseAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          logger.error("Ошибка проверки сессии:", error);
          setError("Ошибка проверки сессии");
          setIsLoading(false);
          return;
        }

        if (session) {
          setIsValidSession(true);
        } else {
          setError("Недействительная ссылка для сброса пароля");
        }
        setIsLoading(false);
      } catch (err) {
        logger.error("Ошибка при проверке сессии:", err);
        setError("Произошла ошибка");
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  async function onSubmit({ password }) {
    setError(null);
    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Перенаправляем на главную страницу через 2 секунды
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      logger.error("Ошибка обновления пароля:", err);
      setError("Произошла ошибка при обновлении пароля");
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted relative overflow-hidden flex items-center justify-center">
        <ParticlesAnimation
          className="w-full h-full overflow-hidden"
          width={800}
          height={600}
          showBackground={false}
        />
        <div className="relative z-20 text-center">
          <div className="text-lg">Проверка ссылки...</div>
        </div>
      </div>
    );
  }

  if (error && !isValidSession) {
    return (
      <div className="min-h-screen bg-muted relative overflow-hidden flex items-center justify-center">
        <ParticlesAnimation
          className="w-full h-full overflow-hidden"
          width={800}
          height={600}
          showBackground={false}
        />
        <div className="relative z-20 text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <Button onClick={() => navigate("/auth")}>Вернуться к входу</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted relative overflow-hidden flex items-center justify-center">
        <ParticlesAnimation
          className="w-full h-full overflow-hidden"
          width={800}
          height={600}
          showBackground={false}
        />
        <div className="relative z-20 text-center">
          <div className="text-green-600 text-lg mb-4">
            Пароль успешно изменен! Перенаправление...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted relative overflow-hidden">
      <ParticlesAnimation
        className="w-full h-full overflow-hidden"
        width={800}
        height={600}
        showBackground={false}
      />

      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="flex w-full items-center justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl animate-pulse" />
            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-xl blur-lg" />

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative bg-background/95 backdrop-blur-sm p-4 sm:p-8 rounded-xl shadow-2xl w-full space-y-4 sm:space-y-6 border border-border/50"
            >
              <h2 className="text-lg font-bold text-center">Новый пароль</h2>

              {error && <FormError message={error} />}
              {authError && <FormError message={authError} />}

              <div>
                <Input
                  type="password"
                  className="w-full"
                  placeholder="Новый пароль"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...register("password")}
                />
                <FormError
                  id="password-error"
                  message={errors.password?.message}
                />
              </div>

              <div>
                <Input
                  type="password"
                  className="w-full"
                  placeholder="Подтвердите пароль"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? "confirm-password-error"
                      : undefined
                  }
                  {...register("confirmPassword")}
                />
                <FormError
                  id="confirm-password-error"
                  message={errors.confirmPassword?.message}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Обновление..." : "Обновить пароль"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
