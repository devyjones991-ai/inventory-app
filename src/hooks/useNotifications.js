import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/supabaseClient";

export function useNotifications() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const { user } = useAuth();
  const { profile } = useProfile();

  // Получаем просроченные задачи
  const getOverdueTasks = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignee_id", user.id)
        .eq("status", "planned")
        .lt("due_date", new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Ошибка получения просроченных задач:", error);
      return [];
    }
  }, [user]);

  // Получаем приближающиеся задачи
  const getUpcomingTasks = useCallback(
    async (daysBefore = 3) => {
      if (!user) return [];

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysBefore);

      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("assignee_id", user.id)
          .eq("status", "planned")
          .gte("due_date", new Date().toISOString())
          .lte("due_date", futureDate.toISOString());

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Ошибка получения приближающихся задач:", error);
        return [];
      }
    },
    [user],
  );

  // Отправка email уведомления
  const sendEmailNotification = useCallback(
    async (tasks, type) => {
      if (!profile?.email) return false;

      try {
        const { error } = await supabase.functions.invoke("send-notification", {
          body: {
            type: "email",
            to: profile.email,
            subject:
              type === "overdue"
                ? "Просроченные задачи"
                : "Приближающиеся задачи",
            tasks: tasks,
            user: {
              name: profile.full_name || user?.email,
              phone: profile.phone,
            },
          },
        });

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Ошибка отправки email:", error);
        return false;
      }
    },
    [profile, user],
  );

  // Отправка SMS уведомления
  const sendSMSNotification = useCallback(
    async (tasks, type) => {
      if (!profile?.phone) return false;

      try {
        const { error } = await supabase.functions.invoke("send-notification", {
          body: {
            type: "sms",
            to: profile.phone,
            message:
              type === "overdue"
                ? `У вас ${tasks.length} просроченных задач`
                : `У вас ${tasks.length} задач с приближающимся сроком`,
            tasks: tasks,
            user: {
              name: profile.full_name || user?.email,
              email: profile.email,
            },
          },
        });

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Ошибка отправки SMS:", error);
        return false;
      }
    },
    [profile, user],
  );

  // Показ браузерного уведомления
  const showBrowserNotification = useCallback(async (tasks, type) => {
    if (!("Notification" in window)) return false;

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;
    }

    if (Notification.permission === "granted") {
      const notification = new Notification(
        type === "overdue" ? "Просроченные задачи" : "Приближающиеся задачи",
        {
          body:
            type === "overdue"
              ? `У вас ${tasks.length} просроченных задач`
              : `У вас ${tasks.length} задач с приближающимся сроком`,
          icon: "/favicon.ico",
          tag: `tasks-${type}`,
        },
      );

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    }

    return false;
  }, []);

  // Основная функция проверки и отправки уведомлений
  const checkAndNotify = useCallback(async () => {
    if (!user || !profile) return;

    const preferences = profile.preferences || {};
    const notifications = preferences.notifications || {};
    const alertSettings = preferences.alertSettings || {};

    // Проверяем, включены ли уведомления о задачах
    if (!notifications.tasks) return;

    setIsChecking(true);

    try {
      // Получаем просроченные задачи
      if (alertSettings.enableOverdueAlerts !== false) {
        const overdueTasks = await getOverdueTasks();

        if (overdueTasks.length > 0) {
          // Email уведомления
          if (notifications.email) {
            await sendEmailNotification(overdueTasks, "overdue");
          }

          // SMS уведомления
          if (notifications.sms && profile.phone) {
            await sendSMSNotification(overdueTasks, "overdue");
          }

          // Браузерные уведомления
          if (notifications.push) {
            await showBrowserNotification(overdueTasks, "overdue");
          }
        }
      }

      // Получаем приближающиеся задачи
      if (alertSettings.enableUpcomingAlerts !== false) {
        const upcomingTasks = await getUpcomingTasks(
          alertSettings.upcomingDays || 3,
        );

        if (upcomingTasks.length > 0) {
          // Email уведомления
          if (notifications.email) {
            await sendEmailNotification(upcomingTasks, "upcoming");
          }

          // SMS уведомления
          if (notifications.sms && profile.phone) {
            await sendSMSNotification(upcomingTasks, "upcoming");
          }

          // Браузерные уведомления
          if (notifications.push) {
            await showBrowserNotification(upcomingTasks, "upcoming");
          }
        }
      }

      setLastCheck(new Date());
    } catch (error) {
      console.error("Ошибка проверки уведомлений:", error);
      toast.error("Ошибка проверки уведомлений");
    } finally {
      setIsChecking(false);
    }
  }, [
    user,
    profile,
    getOverdueTasks,
    getUpcomingTasks,
    sendEmailNotification,
    sendSMSNotification,
    showBrowserNotification,
  ]);

  // Тестовая отправка уведомления
  const testNotification = useCallback(
    async (type = "email") => {
      if (!user || !profile) return false;

      const testTasks = [
        {
          id: "test",
          title: "Тестовая задача",
          due_date: new Date().toISOString(),
          status: "planned",
        },
      ];

      try {
        switch (type) {
          case "email":
            return await sendEmailNotification(testTasks, "test");
          case "sms":
            return await sendSMSNotification(testTasks, "test");
          case "push":
            return await showBrowserNotification(testTasks, "test");
          default:
            return false;
        }
      } catch (error) {
        console.error("Ошибка тестового уведомления:", error);
        return false;
      }
    },
    [
      user,
      profile,
      sendEmailNotification,
      sendSMSNotification,
      showBrowserNotification,
    ],
  );

  // Автоматическая проверка при изменении профиля
  useEffect(() => {
    if (profile?.preferences?.alertSettings?.checkInterval) {
      const interval =
        profile.preferences.alertSettings.checkInterval * 60 * 1000; // в миллисекундах

      const timer = setInterval(() => {
        checkAndNotify();
      }, interval);

      return () => clearInterval(timer);
    }
  }, [profile, checkAndNotify]);

  return {
    isChecking,
    lastCheck,
    checkAndNotify,
    testNotification,
    getOverdueTasks,
    getUpcomingTasks,
  };
}
