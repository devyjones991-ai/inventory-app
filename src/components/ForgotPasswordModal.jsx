import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import FormError from "@/components/FormError.jsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { t } from "@/i18n";

const schema = z.object({
  email: z.string().email(t("auth.email")),
});

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, error: authError } = useSupabaseAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  const handleClose = () => {
    setIsSuccess(false);
    reset();
    onClose();
  };

  async function onSubmit({ email }) {
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (!error) {
      setIsSuccess(true);
    }
  }

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t("auth.resetPasswordTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-green-600 text-sm">
              {t("auth.resetPasswordSent")}
            </div>
            <Button onClick={handleClose} className="w-full">
              {t("auth.backToLogin")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t("auth.resetPasswordTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            {t("auth.resetPasswordDescription")}
          </div>

          {authError && <FormError message={authError} />}

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
              {isLoading ? "..." : t("auth.resetPassword")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
