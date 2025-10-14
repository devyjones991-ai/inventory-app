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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Красивая шапка с градиентом */}
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white rounded-t-lg">
          <div className="absolute inset-0 bg-black/10 rounded-t-lg"></div>
          <div className="relative z-10">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {t("profile.title")}
              </DialogTitle>
              <p className="text-blue-100 text-sm">
                Управляйте своими данными и настройками
              </p>
            </DialogHeader>
          </div>
        </div>

        {/* Основной контент с красивым обрамлением */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-1">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("profile.personalInfo")}
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("profile.security")}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("profile.settings")}
              </TabsTrigger>
            </TabsList>

            {/* Вкладка личных данных */}
            <TabsContent value="personal" className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Личная информация
                  </h3>
                </div>

                <form
                  onSubmit={personalForm.handleSubmit(handlePersonalSave)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.fullName")}
                      </Label>
                      <Input
                        id="fullName"
                        {...personalForm.register("fullName")}
                        aria-invalid={!!personalForm.formState.errors.fullName}
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <FormError
                        message={
                          personalForm.formState.errors.fullName?.message
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...personalForm.register("email")}
                        aria-invalid={!!personalForm.formState.errors.email}
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <FormError
                        message={personalForm.formState.errors.email?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="backupEmail"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.backupEmail")}
                      </Label>
                      <Input
                        id="backupEmail"
                        type="email"
                        {...personalForm.register("backupEmail")}
                        aria-invalid={
                          !!personalForm.formState.errors.backupEmail
                        }
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="example@backup.com"
                      />
                      <FormError
                        message={
                          personalForm.formState.errors.backupEmail?.message
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.phone")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...personalForm.register("phone")}
                        aria-invalid={!!personalForm.formState.errors.phone}
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+7 (999) 123-45-67"
                      />
                      <FormError
                        message={personalForm.formState.errors.phone?.message}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="px-6"
                    >
                      {t("profile.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    >
                      {isSaving ? t("profile.saving") : t("profile.save")}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* Вкладка безопасности */}
            <TabsContent value="security" className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Безопасность аккаунта
                  </h3>
                </div>

                <form
                  onSubmit={securityForm.handleSubmit(handleSecuritySave)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.currentPassword")}
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...securityForm.register("currentPassword")}
                        aria-invalid={
                          !!securityForm.formState.errors.currentPassword
                        }
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <FormError
                        message={
                          securityForm.formState.errors.currentPassword?.message
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.newPassword")}
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...securityForm.register("newPassword")}
                        aria-invalid={
                          !!securityForm.formState.errors.newPassword
                        }
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <FormError
                        message={
                          securityForm.formState.errors.newPassword?.message
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.confirmPassword")}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...securityForm.register("confirmPassword")}
                        aria-invalid={
                          !!securityForm.formState.errors.confirmPassword
                        }
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <FormError
                        message={
                          securityForm.formState.errors.confirmPassword?.message
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Рекомендации по безопасности
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Используйте пароль длиной не менее 8 символов с
                          буквами, цифрами и специальными символами.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="px-6"
                    >
                      {t("profile.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {isSaving ? t("profile.saving") : t("profile.save")}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* Вкладка настроек */}
            <TabsContent value="settings" className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Настройки приложения
                  </h3>
                </div>

                <form
                  onSubmit={settingsForm.handleSubmit(handleSettingsSave)}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="theme"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("profile.theme")}
                      </Label>
                      <select
                        id="theme"
                        {...settingsForm.register("theme")}
                        className="flex h-11 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="light">
                          {t("profile.themes.light")}
                        </option>
                        <option value="dark">{t("profile.themes.dark")}</option>
                        <option value="system">
                          {t("profile.themes.system")}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("profile.notificationsLabel")}
                      </Label>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            </div>
                            <div>
                              <Label
                                htmlFor="notifications-email"
                                className="text-sm font-medium text-gray-900 dark:text-white"
                              >
                                {t("profile.notifications.email")}
                              </Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Получать уведомления по электронной почте
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="notifications-email"
                            {...settingsForm.register("notifications.email")}
                            className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600 dark:text-green-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <Label
                                htmlFor="notifications-push"
                                className="text-sm font-medium text-gray-900 dark:text-white"
                              >
                                {t("profile.notifications.push")}
                              </Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Push-уведомления в браузере
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="notifications-push"
                            {...settingsForm.register("notifications.push")}
                            className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-orange-600 dark:text-orange-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15v-4h4v4H8z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <Label
                                htmlFor="notifications-tasks"
                                className="text-sm font-medium text-gray-900 dark:text-white"
                              >
                                {t("profile.notifications.tasks")}
                              </Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Уведомления о задачах и дедлайнах
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="notifications-tasks"
                            {...settingsForm.register("notifications.tasks")}
                            className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-purple-600 dark:text-purple-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <Label
                                htmlFor="notifications-hardware"
                                className="text-sm font-medium text-gray-900 dark:text-white"
                              >
                                {t("profile.notifications.hardware")}
                              </Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Уведомления об оборудовании
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="notifications-hardware"
                            {...settingsForm.register("notifications.hardware")}
                            className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="px-6"
                    >
                      {t("profile.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
                    >
                      {isSaving ? t("profile.saving") : t("profile.save")}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
