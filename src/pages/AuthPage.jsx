import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import FormError from "@/components/FormError.jsx";
import ParticlesAnimation from "@/components/ParticlesAnimation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { t } from "@/i18n";
import logger from "@/utils/logger";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [userError, setUserError] = useState(null);
  const [info, setInfo] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn, error: authError } = useSupabaseAuth();
  const { user, isLoading } = useAuth();

  const schema = z
    .object({
      email: z.string().email(t("auth.email")),
      password: z.string().min(6, t("auth.password")),
      username: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (isRegister && !data.username) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("auth.username"),
          path: ["username"],
        });
      }
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  function getNetworkErrorMessage(error) {
    if (
      error instanceof TypeError ||
      (error.message && error.message.toLowerCase().includes("failed to fetch"))
    ) {
      logger.error(error);
      return t("auth.networkError");
    }
    return error.message;
  }

  async function onSubmit({ email, password, username }) {
    setUserError(null);
    setInfo(null);
    if (isRegister) {
      const { data, error } = await signUp(email, password, username);
      if (error) {
        setUserError(getNetworkErrorMessage(error));
      } else if (data.user && data.user.confirmed_at === null) {
        setInfo(t("auth.checkEmail"));
      } else if (!data.session) {
        setInfo("Не удалось создать сессию. Попробуйте позже.");
      } else {
        navigate("/");
      }
    } else {
      const { data, error } = await signIn(email, password);
      if (error) {
        setUserError(getNetworkErrorMessage(error));
      } else if (!data.session) {
        setInfo("Не удалось выполнить вход. Попробуйте позже.");
      } else {
        navigate("/");
      }
    }
  }

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-muted relative overflow-hidden">
      {/* Анимация частиц НАД окном */}
      <ParticlesAnimation
        className="w-full h-full overflow-hidden"
        width={800}
        height={600}
        showBackground={false}
      />

      {/* Контент авторизации */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="flex w-full items-center justify-center">
          {/* Свечение за окном */}
          <div className="relative w-full max-w-md">
            {/* Внешнее свечение */}
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl animate-pulse" />
            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-xl blur-lg" />

            {/* Само окно авторизации */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative bg-background/95 backdrop-blur-sm p-4 sm:p-8 rounded-xl shadow-2xl w-full space-y-4 sm:space-y-6 border border-border/50"
            >
              <h2 className="text-lg font-bold text-center">
                {isRegister ? t("auth.register") : t("auth.login")}
              </h2>
              {userError && <FormError message={userError} />}
              {authError && (
                <div className="text-gray-500 text-xs">{authError}</div>
              )}
              {info && <div className="text-blue-500 text-sm">{info}</div>}

              <div>
                <Input
                  type="email"
                  className="w-full"
                  placeholder={t("auth.email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                <FormError id="email-error" message={errors.email?.message} />
              </div>

              {isRegister && (
                <div>
                  <Input
                    type="text"
                    className="w-full"
                    placeholder={t("auth.username")}
                    aria-invalid={!!errors.username}
                    aria-describedby={
                      errors.username ? "username-error" : undefined
                    }
                    {...register("username")}
                  />
                  <FormError
                    id="username-error"
                    message={errors.username?.message}
                  />
                </div>
              )}

              <div>
                <Input
                  type="password"
                  className="w-full"
                  placeholder={t("auth.password")}
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

              <Button type="submit" className="w-full">
                {isRegister ? t("auth.register") : t("auth.login")}
              </Button>

              {!isRegister && (
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  {t("auth.forgotPassword")}
                </Button>
              )}

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? t("auth.already") : t("auth.noAccount")}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
