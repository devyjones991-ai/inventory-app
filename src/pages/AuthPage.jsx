import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import logger from "@/utils/logger";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/i18n";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [userError, setUserError] = useState(null);
  const [info, setInfo] = useState(null);
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
    <div>
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="flex w-full min-h-screen items-center justify-center bg-background">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-background p-6 rounded shadow w-full max-w-sm space-y-4"
          >
            <h2 className="text-lg font-bold text-center">
              {isRegister ? t("auth.register") : t("auth.login")}
            </h2>
            {userError && (
              <div className="text-red-500 text-sm">{userError}</div>
            )}
            {authError && (
              <div className="text-gray-500 text-xs">{authError}</div>
            )}
            {info && <div className="text-blue-500 text-sm">{info}</div>}

            <div>
              <Input
                type="email"
                className="w-full"
                placeholder={t("auth.email")}
                {...register("email")}
              />
              {errors.email && (
                <div className="text-red-500 text-sm">
                  {errors.email.message}
                </div>
              )}
            </div>

            {isRegister && (
              <div>
                <Input
                  type="text"
                  className="w-full"
                  placeholder={t("auth.username")}
                  {...register("username")}
                />
                {errors.username && (
                  <div className="text-red-500 text-sm">
                    {errors.username.message}
                  </div>
                )}
              </div>
            )}

            <div>
              <Input
                type="password"
                className="w-full"
                placeholder={t("auth.password")}
                {...register("password")}
              />
              {errors.password && (
                <div className="text-red-500 text-sm">
                  {errors.password.message}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">
              {isRegister ? t("auth.register") : t("auth.login")}
            </Button>
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
  );
}
