import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useProfile } from "../hooks/useProfile";
import { t } from "../i18n";

import FormError from "./FormError";
import { Button } from "./ui/button";
import "../assets/profile-modal-styles.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Схемы валидации для разных вкладок
const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Полное имя обязательно"),
  email: z.string().email("Неверный формат email"),
  backupEmail: z
    .string()
    .email("Неверный формат резервного email")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
});

const securitySchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Текущий пароль обязателен"),
    newPassword: z
      .string()
      .min(8, "Новый пароль должен содержать минимум 8 символов"),
    confirmPassword: z
      .string()
      .min(1, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]),
  language: z.enum(["ru", "en"]),
  timezone: z.string().min(1, "Часовой пояс обязателен"),
  dateFormat: z.string().min(1, "Формат даты обязателен"),
  timeFormat: z.enum(["12h", "24h"]),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettings({
  isOpen,
  onClose,
}: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { requestPermission, permission } = useNotifications();

  const personalForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: profile?.full_name || "",
      email: user?.email || "",
      backupEmail: profile?.backup_email || "",
      phone: profile?.phone || "",
      position: profile?.position || "",
      department: profile?.department || "",
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

  const preferencesForm = useForm({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: profile?.preferences?.theme || "auto",
      language: profile?.preferences?.language || "ru",
      timezone: profile?.preferences?.timezone || "Europe/Moscow",
      dateFormat: profile?.preferences?.date_format || "DD.MM.YYYY",
      timeFormat: profile?.preferences?.time_format || "24h",
      emailNotifications: profile?.preferences?.notifications?.email || true,
      pushNotifications: profile?.preferences?.notifications?.push || true,
      smsNotifications: profile?.preferences?.notifications?.sms || false,
    },
  });

  const handlePersonalSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      await updateProfile({
        full_name: data.fullName,
        backup_email: data.backupEmail,
        phone: data.phone,
        position: data.position,
        department: data.department,
      });
      toast.success(t("profile.personalInfoUpdated"));
    } catch {
      toast.error(t("profile.updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async (_data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      // Здесь должна быть логика обновления пароля
      toast.success(t("profile.passwordUpdated"));
      securityForm.reset();
    } catch {
      toast.error(t("profile.updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      await updateProfile({
        preferences: {
          theme: data.theme,
          language: data.language,
          timezone: data.timezone,
          date_format: data.dateFormat,
          time_format: data.timeFormat,
          notifications: {
            email: data.emailNotifications,
            push: data.pushNotifications,
            sms: data.smsNotifications,
          },
        },
      });
      toast.success(t("profile.preferencesUpdated"));
    } catch {
      toast.error(t("profile.updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    await requestPermission();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-background to-muted/50 border-0 shadow-2xl rounded-xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="profile-title">
            Настройки профиля
          </DialogTitle>
          <p className="text-muted-foreground">Управляйте своими данными и настройками</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              Личная информация
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Безопасность</TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div className="bg-card/50 p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Личная информация</h3>
              <form
                onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}
                className="space-y-4"
              >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="profile-label">Полное имя</Label>
                  <Input
                    {...personalForm.register("fullName")}
                    id="fullName"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={personalForm.formState.errors.fullName?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="profile-label">Email</Label>
                  <Input
                    {...personalForm.register("email")}
                    id="email"
                    type="email"
                    disabled
                    className="profile-input w-full"
                  />
                  <FormError
                    error={personalForm.formState.errors.email?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="backupEmail" className="profile-label">
                    Резервный email
                  </Label>
                  <Input
                    {...personalForm.register("backupEmail")}
                    id="backupEmail"
                    type="email"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={personalForm.formState.errors.backupEmail?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="profile-label">Телефон</Label>
                  <Input
                    {...personalForm.register("phone")}
                    id="phone"
                    type="tel"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={personalForm.formState.errors.phone?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="position" className="profile-label">Должность</Label>
                  <Input
                    {...personalForm.register("position")}
                    id="position"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={personalForm.formState.errors.position?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="profile-label">Отдел</Label>
                  <Input
                    {...personalForm.register("department")}
                    id="department"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={personalForm.formState.errors.department?.message}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} className="profile-button-secondary">
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading} className="profile-button">
                  {isLoading ? "Загрузка..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="bg-card/50 p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Безопасность</h3>
            <form
              onSubmit={securityForm.handleSubmit(handleSecuritySubmit)}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="profile-label">
                    {t("profile.currentPassword")}
                  </Label>
                  <Input
                    {...securityForm.register("currentPassword")}
                    id="currentPassword"
                    type="password"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={
                      securityForm.formState.errors.currentPassword?.message
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="profile-label">
                    {t("profile.newPassword")}
                  </Label>
                  <Input
                    {...securityForm.register("newPassword")}
                    id="newPassword"
                    type="password"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={securityForm.formState.errors.newPassword?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="profile-label">
                    {t("profile.confirmPassword")}
                  </Label>
                  <Input
                    {...securityForm.register("confirmPassword")}
                    id="confirmPassword"
                    type="password"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={
                      securityForm.formState.errors.confirmPassword?.message
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} className="profile-button-secondary">
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading} className="profile-button">
                  {isLoading ? "Загрузка..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="bg-card/50 p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Настройки</h3>
            <form
              onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme" className="profile-label">{t("profile.theme")}</Label>
                  <select
                    {...preferencesForm.register("theme")}
                    id="theme"
                    className="profile-input w-full"
                  >
                    <option value="light">{t("profile.themeLight")}</option>
                    <option value="dark">{t("profile.themeDark")}</option>
                    <option value="auto">{t("profile.themeAuto")}</option>
                  </select>
                  <FormError
                    error={preferencesForm.formState.errors.theme?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="language" className="profile-label">{t("profile.language")}</Label>
                  <select
                    {...preferencesForm.register("language")}
                    id="language"
                    className="profile-input w-full"
                  >
                    <option value="ru">{t("profile.languageRu")}</option>
                    <option value="en">{t("profile.languageEn")}</option>
                  </select>
                  <FormError
                    error={preferencesForm.formState.errors.language?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone" className="profile-label">{t("profile.timezone")}</Label>
                  <Input
                    {...preferencesForm.register("timezone")}
                    id="timezone"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={preferencesForm.formState.errors.timezone?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="dateFormat" className="profile-label">{t("profile.dateFormat")}</Label>
                  <Input
                    {...preferencesForm.register("dateFormat")}
                    id="dateFormat"
                    className="profile-input w-full"
                  />
                  <FormError
                    error={preferencesForm.formState.errors.dateFormat?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="timeFormat" className="profile-label">{t("profile.timeFormat")}</Label>
                  <select
                    {...preferencesForm.register("timeFormat")}
                    id="timeFormat"
                    className="profile-input w-full"
                  >
                    <option value="12h">{t("profile.timeFormat12h")}</option>
                    <option value="24h">{t("profile.timeFormat24h")}</option>
                  </select>
                  <FormError
                    error={preferencesForm.formState.errors.timeFormat?.message}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">{t("profile.notifications")}</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      {...preferencesForm.register("emailNotifications")}
                      type="checkbox"
                      className="rounded"
                    />
                    <span>{t("profile.emailNotifications")}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      {...preferencesForm.register("pushNotifications")}
                      type="checkbox"
                      className="rounded"
                    />
                    <span>{t("profile.pushNotifications")}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      {...preferencesForm.register("smsNotifications")}
                      type="checkbox"
                      className="rounded"
                    />
                    <span>{t("profile.smsNotifications")}</span>
                  </label>
                </div>

                {permission === "default" && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("profile.notificationPermissionRequired")}
                    </p>
                    <Button
                      size="sm"
                      onClick={handleRequestNotificationPermission}
                      className="profile-button"
                    >
                      {t("profile.requestPermission")}
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} className="profile-button-secondary">
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading} className="profile-button">
                  {isLoading ? "Загрузка..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
