import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Users, Edit } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useProfile } from "../hooks/useProfile";
import { supabase } from "../supabaseClient";
import { t } from "../i18n";
import "../assets/space-theme.css";

import FormError from "./FormError";
import { Badge } from "./ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
    currentPassword: z.string().min(1, "Текущий пароль обязателен"),
    newPassword: z
      .string()
      .min(8, "Новый пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

const preferencesSchema = z.object({
  language: z.enum(["ru", "en"]),
  timezone: z.string().min(1, "Часовой пояс обязателен"),
  dateFormat: z.string().min(1, "Формат даты обязателен"),
  timeFormat: z.enum(["12h", "24h"]),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

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
  const { user, role } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { requestPermission, permission } = useNotifications();
  const navigate = useNavigate();

  // Состояния для управления пользователями
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<string>("");

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

  // Проверка, является ли пользователь суперпользователем
  const isSuperuser = role === "superuser";
  
  // Отладка: логируем роль
  useEffect(() => {
    if (isOpen) {
      console.log("ProfileSettings: role =", role, "isSuperuser =", isSuperuser);
    }
  }, [isOpen, role, isSuperuser]);

  // Загрузка списка пользователей (только для superuser)
  const loadUsers = useCallback(async () => {
    if (!isSuperuser) return;

    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
      toast.error("Не удалось загрузить список пользователей");
    } finally {
      setLoadingUsers(false);
    }
  }, [isSuperuser]);

  // Загружаем пользователей при открытии вкладки администрирования
  useEffect(() => {
    if (isOpen && isSuperuser && activeTab === "administration") {
      loadUsers();
    }
  }, [isOpen, isSuperuser, activeTab, loadUsers]);

  // Редактирование роли пользователя
  const handleEditUserRole = (userProfile: UserProfile) => {
    setEditingUser(userProfile);
    setEditRole(userProfile.role);
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;

    // Защита: нельзя изменить роль superuser (кроме самого себя)
    if (editingUser.role === "superuser" && editingUser.id !== user?.id) {
      toast.error("Нельзя изменить роль другого суперпользователя");
      return;
    }

    // Защита: нельзя удалить superuser роль у самого себя
    if (editingUser.id === user?.id && editRole !== "superuser") {
      toast.error("Вы не можете изменить свою собственную роль superuser");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: editRole, updated_at: new Date().toISOString() })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("Роль пользователя обновлена");
      setEditingUser(null);
      loadUsers();
      
      // Если изменили свою роль, перезагружаем страницу
      if (editingUser.id === user?.id) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error("Ошибка обновления роли:", error);
      toast.error("Не удалось обновить роль пользователя");
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditRole("");
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl space-modal space-fade-in">
        <DialogHeader className="space-modal-header">
          <DialogTitle className="text-white text-2xl font-bold">
            👤 Настройки профиля
          </DialogTitle>
          <p className="text-white/80 mt-2">
            Управляйте своими данными и настройками
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList
            className={`grid w-full ${
              isSuperuser ? "grid-cols-4" : "grid-cols-3"
            } bg-space-bg-light p-1 rounded-lg border border-space-border`}
          >
            <TabsTrigger
              value="personal"
              className="data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300"
            >
              👤 Личная информация
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300"
            >
              🔒 Безопасность
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300"
            >
              ⚙️ Настройки
            </TabsTrigger>
            {isSuperuser && (
              <TabsTrigger
                value="administration"
                className="data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300"
              >
                🛡️ Администрирование
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div className="space-card p-6 space-fade-in">
              <h3 className="space-title text-xl mb-6">👤 Личная информация</h3>
              <form
                onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="fullName"
                      className="text-space-text font-semibold"
                    >
                      👤 Полное имя
                    </Label>
                    <Input
                      {...personalForm.register("fullName")}
                      id="fullName"
                      className="space-input w-full"
                      placeholder="Введите ваше полное имя..."
                      autoFocus
                    />
                    <FormError
                      error={personalForm.formState.errors.fullName?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-space-text font-semibold"
                    >
                      📧 Email
                    </Label>
                    <Input
                      {...personalForm.register("email")}
                      id="email"
                      type="email"
                      disabled
                      className="space-input w-full bg-space-bg-light/50"
                    />
                    <FormError
                      error={personalForm.formState.errors.email?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="backupEmail"
                      className="text-space-text font-semibold"
                    >
                      📧 Резервный email
                    </Label>
                    <Input
                      {...personalForm.register("backupEmail")}
                      id="backupEmail"
                      type="email"
                      className="space-input w-full"
                      placeholder="Введите резервный email..."
                    />
                    <FormError
                      error={personalForm.formState.errors.backupEmail?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-space-text font-semibold"
                    >
                      📱 Телефон
                    </Label>
                    <Input
                      {...personalForm.register("phone")}
                      id="phone"
                      type="tel"
                      className="space-input w-full"
                      placeholder="+7 (999) 123-45-67"
                    />
                    <FormError
                      error={personalForm.formState.errors.phone?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="position"
                      className="text-space-text font-semibold"
                    >
                      💼 Должность
                    </Label>
                    <Input
                      {...personalForm.register("position")}
                      id="position"
                      className="space-input w-full"
                      placeholder="Введите вашу должность..."
                    />
                    <FormError
                      error={personalForm.formState.errors.position?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="department"
                      className="text-space-text font-semibold"
                    >
                      🏢 Отдел
                    </Label>
                    <Input
                      {...personalForm.register("department")}
                      id="department"
                      className="space-input w-full"
                      placeholder="Введите название отдела..."
                    />
                    <FormError
                      error={personalForm.formState.errors.department?.message}
                    />
                  </div>
                </div>
                <DialogFooter className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="space-button"
                  >
                    ❌ Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="space-button space-active"
                  >
                    {isLoading ? "⏳ Загрузка..." : "💾 Сохранить"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="space-card p-6 space-fade-in">
              <h3 className="space-title text-xl mb-6">🔒 Безопасность</h3>
              <form
                onSubmit={securityForm.handleSubmit(handleSecuritySubmit)}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="currentPassword"
                      className="text-space-text font-semibold"
                    >
                      🔑 Текущий пароль
                    </Label>
                    <Input
                      {...securityForm.register("currentPassword")}
                      id="currentPassword"
                      type="password"
                      className="space-input w-full"
                      placeholder="Введите текущий пароль..."
                    />
                    <FormError
                      error={
                        securityForm.formState.errors.currentPassword?.message
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="newPassword"
                      className="text-space-text font-semibold"
                    >
                      🆕 Новый пароль
                    </Label>
                    <Input
                      {...securityForm.register("newPassword")}
                      id="newPassword"
                      type="password"
                      className="space-input w-full"
                      placeholder="Введите новый пароль..."
                    />
                    <FormError
                      error={securityForm.formState.errors.newPassword?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-space-text font-semibold"
                    >
                      🔐 Подтвердите пароль
                    </Label>
                    <Input
                      {...securityForm.register("confirmPassword")}
                      id="confirmPassword"
                      type="password"
                      className="space-input w-full"
                      placeholder="Подтвердите новый пароль..."
                    />
                    <FormError
                      error={
                        securityForm.formState.errors.confirmPassword?.message
                      }
                    />
                  </div>
                </div>
                <DialogFooter className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="space-button"
                  >
                    ❌ Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="space-button space-active"
                  >
                    {isLoading ? "⏳ Загрузка..." : "🔒 Сохранить"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="space-card p-6 space-fade-in">
              <h3 className="space-title text-xl mb-6">⚙️ Настройки</h3>
              <form
                onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="language"
                      className="text-space-text font-semibold"
                    >
                      🌍 Язык
                    </Label>
                    <select
                      {...preferencesForm.register("language")}
                      id="language"
                      className="space-select w-full"
                    >
                      <option value="ru">🇷🇺 Русский</option>
                      <option value="en">🇺🇸 English</option>
                    </select>
                    <FormError
                      error={preferencesForm.formState.errors.language?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="timezone"
                      className="text-space-text font-semibold"
                    >
                      🕐 Часовой пояс
                    </Label>
                    <Input
                      {...preferencesForm.register("timezone")}
                      id="timezone"
                      className="space-input w-full"
                      placeholder="Europe/Moscow"
                    />
                    <FormError
                      error={preferencesForm.formState.errors.timezone?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="dateFormat"
                      className="text-space-text font-semibold"
                    >
                      📅 Формат даты
                    </Label>
                    <Input
                      {...preferencesForm.register("dateFormat")}
                      id="dateFormat"
                      className="space-input w-full"
                      placeholder="DD.MM.YYYY"
                    />
                    <FormError
                      error={
                        preferencesForm.formState.errors.dateFormat?.message
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="timeFormat"
                      className="text-space-text font-semibold"
                    >
                      ⏰ Формат времени
                    </Label>
                    <select
                      {...preferencesForm.register("timeFormat")}
                      id="timeFormat"
                      className="space-select w-full"
                    >
                      <option value="12h">🕐 12-часовой</option>
                      <option value="24h">🕒 24-часовой</option>
                    </select>
                    <FormError
                      error={
                        preferencesForm.formState.errors.timeFormat?.message
                      }
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-space-text font-semibold text-lg">
                    🔔 Уведомления
                  </h4>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 p-3 space-card hover:space-active transition-all duration-300">
                      <input
                        {...preferencesForm.register("emailNotifications")}
                        type="checkbox"
                        className="rounded space-icon"
                      />
                      <span className="text-space-text font-medium">
                        📧 Email уведомления
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 space-card hover:space-active transition-all duration-300">
                      <input
                        {...preferencesForm.register("pushNotifications")}
                        type="checkbox"
                        className="rounded space-icon"
                      />
                      <span className="text-space-text font-medium">
                        🔔 Push уведомления
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 space-card hover:space-active transition-all duration-300">
                      <input
                        {...preferencesForm.register("smsNotifications")}
                        type="checkbox"
                        className="rounded space-icon"
                      />
                      <span className="text-space-text font-medium">
                        📱 SMS уведомления
                      </span>
                    </label>
                  </div>

                  {permission === "default" && (
                    <div className="p-4 space-card">
                      <p className="text-space-text-muted mb-3">
                        🔔 Требуется разрешение на уведомления
                      </p>
                      <Button
                        size="sm"
                        onClick={handleRequestNotificationPermission}
                        className="space-button"
                      >
                        🔔 Запросить разрешение
                      </Button>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="space-button"
                  >
                    ❌ Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="space-button space-active"
                  >
                    {isLoading ? "⏳ Загрузка..." : "⚙️ Сохранить"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </TabsContent>

          {isSuperuser && (
            <TabsContent value="administration" className="space-y-6">
              <div className="space-card p-6 space-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="space-title text-xl">
                      🛡️ Управление пользователями
                    </h3>
                    <p className="text-space-text-muted text-sm mt-1">
                      ⭐ Вы - суперпользователь с полными правами
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      navigate("/admin");
                    }}
                    className="space-button flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Полная панель администратора
                  </Button>
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-space-accent mx-auto"></div>
                      <p className="mt-4 text-space-text-muted">
                        Загрузка пользователей...
                      </p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-space-text-muted mx-auto mb-4" />
                    <p className="text-space-text-muted">
                      Пользователи не найдены
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {users.map((userProfile) => (
                      <div
                        key={userProfile.id}
                        className="space-card p-4 hover:space-active transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-space-text font-semibold text-lg">
                                {userProfile.full_name || "Без имени"}
                              </h4>
                              <Badge
                                variant={
                                  userProfile.role === "superuser"
                                    ? "destructive"
                                    : userProfile.role === "admin"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {userProfile.role === "superuser"
                                  ? "⭐ Суперпользователь"
                                  : userProfile.role === "admin"
                                  ? "🛡️ Администратор"
                                  : "👤 Пользователь"}
                              </Badge>
                            </div>
                            <p className="text-space-text-muted text-sm mb-1">
                              {userProfile.email}
                            </p>
                            <div className="flex gap-4 text-xs text-space-text-muted">
                              <span>
                                Создан:{" "}
                                {new Date(
                                  userProfile.created_at,
                                ).toLocaleDateString("ru-RU")}
                              </span>
                              {userProfile.last_sign_in_at && (
                                <span>
                                  Последний вход:{" "}
                                  {new Date(
                                    userProfile.last_sign_in_at,
                                  ).toLocaleDateString("ru-RU")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            {editingUser?.id === userProfile.id ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={editRole}
                                  onValueChange={setEditRole}
                                >
                                  <SelectTrigger className="w-40 space-select">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">
                                      👤 Пользователь
                                    </SelectItem>
                                    <SelectItem value="admin">
                                      🛡️ Администратор
                                    </SelectItem>
                                    <SelectItem value="superuser" disabled={editingUser?.id === user?.id ? false : editingUser?.role !== "superuser"}>
                                      ⭐ Суперпользователь
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={handleSaveUserRole}
                                  className="space-button space-active"
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="space-button"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUserRole(userProfile)}
                                className="space-button flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Изменить роль
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
