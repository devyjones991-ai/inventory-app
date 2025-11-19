import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

import { supabase } from "../supabaseClient";

import { useAuth } from "./useAuth";
// import { useProfile } from "./useProfile";

interface Notification {
  id: string;
  type: "overdue_task" | "new_message" | "task_assigned" | "system";
  title: string;
  message: string;
  user_id: string;
  object_id?: string;
  created_at: string;
  read?: boolean;
  _optimistic?: boolean;
}

export function useNotifications() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  // const { profile } = useProfile();

  // Получаем просроченные задачи
  const getOverdueTasks = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignee_id", user.id)
        .eq("status", "pending")
        .lt("due_date", new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Ошибка получения просроченных задач:", error);
      return [];
    }
  }, [user]);

  // Получаем предстоящие задачи
  const getUpcomingTasks = useCallback(
    async (daysBefore = 3) => {
      if (!user) return [];

      try {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysBefore);

        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("assignee_id", user.id)
          .eq("status", "pending")
          .gte("due_date", new Date().toISOString())
          .lte("due_date", futureDate.toISOString());

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Ошибка получения предстоящих задач:", error);
        return [];
      }
    },
    [user],
  );

  // Проверяем и создаем уведомления
  const checkAndNotify = useCallback(async () => {
    if (!user || isChecking) return;

    setIsChecking(true);
    try {
      const overdueTasks = await getOverdueTasks();
      const upcomingTasks = await getUpcomingTasks();

      // Создаем уведомления для просроченных задач
      for (const task of overdueTasks) {
        const notification: Notification = {
          id: `overdue-${task.id}`,
          type: "overdue_task",
          title: "Просроченная задача",
          message: `Задача "${task.title}" просрочена`,
          created_at: new Date().toISOString(),
        };

        // Проверяем, не создано ли уже такое уведомление
        const existingNotification = notifications.find(
          (n) => n.id === notification.id,
        );
        if (!existingNotification) {
          setNotifications((prev) => [...prev, notification]);
          setUnreadCount((prev) => prev + 1);
        }
      }

      // Создаем уведомления для предстоящих задач
      for (const task of upcomingTasks) {
        const notification: Notification = {
          id: `upcoming-${task.id}`,
          type: "task_assigned",
          title: "Предстоящая задача",
          message: `Задача "${task.title}" скоро истекает`,
          created_at: new Date().toISOString(),
        };

        // Проверяем, не создано ли уже такое уведомление
        const existingNotification = notifications.find(
          (n) => n.id === notification.id,
        );
        if (!existingNotification) {
          setNotifications((prev) => [...prev, notification]);
          setUnreadCount((prev) => prev + 1);
        }
      }

      setLastCheck(new Date());
    } catch (error) {
      console.error("Ошибка проверки уведомлений:", error);
    } finally {
      setIsChecking(false);
    }
  }, [user, isChecking, getOverdueTasks, getUpcomingTasks, notifications]);

  // Тестовая функция для проверки уведомлений
  const testNotification = useCallback(async (_type = "test") => {
    try {
      if (!("Notification" in window)) {
        throw new Error("Браузер не поддерживает уведомления");
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Разрешение на уведомления не предоставлено");
        }
      }

      if (Notification.permission === "granted") {
        const notification = new Notification("Тестовое уведомление", {
          body: "Это тестовое уведомление",
          icon: "/favicon.ico",
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return true;
      }

      return false;
    } catch (error) {
      console.error("Ошибка тестового уведомления:", error);
      toast.error("Ошибка тестового уведомления");
      return false;
    }
  }, []);

  // Запускаем проверку каждые 5 минут
  useEffect(() => {
    const interval = setInterval(checkAndNotify, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);

  // Проверяем при загрузке
  useEffect(() => {
    if (user) {
      checkAndNotify();
    }
  }, [user, checkAndNotify]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      return await Notification.requestPermission();
    }
    return "denied";
  }, []);

  const isSupported = "Notification" in window;
  const permission = isSupported ? Notification.permission : "denied";

  return {
    notifications,
    unreadCount,
    isChecking,
    lastCheck,
    checkAndNotify,
    testNotification,
    getOverdueTasks,
    getUpcomingTasks,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    requestPermission,
    isSupported,
    permission,
  };
}
