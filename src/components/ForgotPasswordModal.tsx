import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { t } from "../i18n";

import FormError from "./FormError";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const schema = z.object({
  email: z.string().email(t("auth.email")),
});

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, error: authError } = useSupabaseAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      if (error) {
        console.error("Reset password error:", error);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.forgotPassword")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register("email")}
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              className="w-full"
            />
            <FormError message={errors.email?.message} />
          </div>

          {authError && (
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {authError}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-sm text-green-600 dark:text-green-400">
                {t("auth.resetPasswordSent")}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t("common.loading") : t("auth.sendResetLink")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
