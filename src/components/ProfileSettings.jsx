import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import FormError from "@/components/FormError.jsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { t } from "@/i18n";

// Схемы валидации для разных вкладок
const personalInfoSchema = z.object({
  fullName: z.string().min(1, t("profile.validation.fullNameRequired")),
  email: z.string().email(t("profile.validation.emailInvalid")),
  backupEmail: z
    .string()
    .email(t("profile.validation.backupEmailInvalid"))
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

const securitySchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, t("profile.validation.passwordRequired")),
    newPassword: z.string().min(6, t("profile.validation.passwordMinLength")),
    confirmPassword: z
      .string()
      .min(6, t("profile.validation.passwordMinLength")),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t("profile.validation.passwordsMatch"),
    path: ["confirmPassword"],
  });

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    tasks: z.boolean(),
    hardware: z.boolean(),
  }),
});

export default function ProfileSettings({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { profile, updateProfile, updatePassword, updateEmail } = useProfile();

  // Формы для разных вкладок
  const personalForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: profile?.full_name || user?.user_metadata?.full_name || "",
      email: user?.email || "",
      backupEmail: profile?.backup_email || "",
      phone: profile?.phone || "",
    },
  });

  const securityForm = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const settingsForm = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "system",
      notifications: {
        email: true,
        push: false,
        tasks: true,
        hardware: true,
      },
    },
  });

  // Обновляем формы при изменении профиля
  React.useEffect(() => {
    if (profile && user) {
      personalForm.reset({
        fullName: profile.full_name || user.user_metadata?.full_name || "",
        email: user.email || "",
        backupEmail: profile.backup_email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, user, personalForm]);

  // Обработчики сохранения для разных вкладок
  const handlePersonalSave = async (data) => {
    setIsSaving(true);
    try {
      // Обновляем профиль в базе данных
      const { error: profileError } = await updateProfile({
        full_name: data.fullName,
        backup_email: data.backupEmail || null,
        phone: data.phone || null,
      });

      if (profileError) {
        toast.error(t("profile.error") + ": " + profileError.message);
        return;
      }

      // Обновляем email если он изменился
      if (data.email !== user.email) {
        const { error: emailError } = await updateEmail(data.email);
        if (emailError) {
          toast.error(t("profile.error") + ": " + emailError.message);
          return;
        }
      }

      toast.success(t("profile.saved"));
    } catch (error) {
      toast.error(t("profile.error") + ": " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySave = async (data) => {
    setIsSaving(true);
    try {
      const { error } = await updatePassword(data.newPassword);
      if (error) {
        toast.error(t("profile.error") + ": " + error.message);
        return;
      }

      // Очищаем форму
      securityForm.reset();
      toast.success(t("profile.saved"));
    } catch (error) {
      toast.error(t("profile.error") + ": " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsSave = async (data) => {
    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        preferences: data,
      });

      if (error) {
        toast.error(t("profile.error") + ": " + error.message);
        return;
      }

      toast.success(t("profile.saved"));
    } catch (error) {
      toast.error(t("profile.error") + ": " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile && !user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.title")}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              {t("profile.personalInfo")}
            </TabsTrigger>
            <TabsTrigger value="security">{t("profile.security")}</TabsTrigger>
            <TabsTrigger value="settings">{t("profile.settings")}</TabsTrigger>
          </TabsList>

          {/* Вкладка личных данных */}
          <TabsContent value="personal" className="space-y-4">
            <form
              onSubmit={personalForm.handleSubmit(handlePersonalSave)}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input
                  id="fullName"
                  {...personalForm.register("fullName")}
                  aria-invalid={!!personalForm.formState.errors.fullName}
                />
                <FormError
                  message={personalForm.formState.errors.fullName?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t("profile.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  {...personalForm.register("email")}
                  aria-invalid={!!personalForm.formState.errors.email}
                />
                <FormError
                  message={personalForm.formState.errors.email?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="backupEmail">{t("profile.backupEmail")}</Label>
                <Input
                  id="backupEmail"
                  type="email"
                  {...personalForm.register("backupEmail")}
                  aria-invalid={!!personalForm.formState.errors.backupEmail}
                />
                <FormError
                  message={personalForm.formState.errors.backupEmail?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">{t("profile.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...personalForm.register("phone")}
                  aria-invalid={!!personalForm.formState.errors.phone}
                />
                <FormError
                  message={personalForm.formState.errors.phone?.message}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  {t("profile.cancel")}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("profile.saving") : t("profile.save")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Вкладка безопасности */}
          <TabsContent value="security" className="space-y-4">
            <form
              onSubmit={securityForm.handleSubmit(handleSecuritySave)}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">
                  {t("profile.currentPassword")}
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...securityForm.register("currentPassword")}
                  aria-invalid={!!securityForm.formState.errors.currentPassword}
                />
                <FormError
                  message={
                    securityForm.formState.errors.currentPassword?.message
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...securityForm.register("newPassword")}
                  aria-invalid={!!securityForm.formState.errors.newPassword}
                />
                <FormError
                  message={securityForm.formState.errors.newPassword?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">
                  {t("profile.confirmPassword")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...securityForm.register("confirmPassword")}
                  aria-invalid={!!securityForm.formState.errors.confirmPassword}
                />
                <FormError
                  message={
                    securityForm.formState.errors.confirmPassword?.message
                  }
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  {t("profile.cancel")}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("profile.saving") : t("profile.save")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Вкладка настроек */}
          <TabsContent value="settings" className="space-y-4">
            <form
              onSubmit={settingsForm.handleSubmit(handleSettingsSave)}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="theme">{t("profile.theme")}</Label>
                <select
                  id="theme"
                  {...settingsForm.register("theme")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="light">{t("profile.themes.light")}</option>
                  <option value="dark">{t("profile.themes.dark")}</option>
                  <option value="system">{t("profile.themes.system")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{t("profile.notificationsLabel")}</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifications-email"
                      {...settingsForm.register("notifications.email")}
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="notifications-email"
                      className="text-sm font-normal"
                    >
                      {t("profile.notifications.email")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifications-push"
                      {...settingsForm.register("notifications.push")}
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="notifications-push"
                      className="text-sm font-normal"
                    >
                      {t("profile.notifications.push")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifications-tasks"
                      {...settingsForm.register("notifications.tasks")}
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="notifications-tasks"
                      className="text-sm font-normal"
                    >
                      {t("profile.notifications.tasks")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifications-hardware"
                      {...settingsForm.register("notifications.hardware")}
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="notifications-hardware"
                      className="text-sm font-normal"
                    >
                      {t("profile.notifications.hardware")}
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  {t("profile.cancel")}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("profile.saving") : t("profile.save")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
