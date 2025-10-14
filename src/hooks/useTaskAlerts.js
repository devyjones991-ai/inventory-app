import { useEffect, useCallback, useRef } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useTasks } from "@/hooks/useTasks";

export function useTaskAlerts(objectId) {
  const { tasks } = useTasks(objectId);
  const { notifyOverdueTask, notifyUpcomingDeadline } = useNotifications();
  const { user } = useAuth();
  const notifiedTasksRef = useRef(new Set());
  const checkIntervalRef = useRef(null);

  // Проверяем задачи на просроченность и приближающиеся дедлайны
  const checkTasks = useCallback(() => {
    if (!tasks || !user) return;

    const now = new Date();
    // const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    tasks.forEach((task) => {
      if (!task.due_date || task.status === "completed") return;

      const dueDate = new Date(task.due_date);
      const taskKey = `${task.id}-${task.due_date}`;

      // Проверяем просроченные задачи
      if (dueDate < now) {
        if (!notifiedTasksRef.current.has(`overdue-${taskKey}`)) {
          notifyOverdueTask(task);
          notifiedTasksRef.current.add(`overdue-${taskKey}`);
        }
      }
      // Проверяем задачи с приближающимся дедлайном (в течение часа)
      else if (dueDate <= oneHourFromNow) {
        if (!notifiedTasksRef.current.has(`upcoming-${taskKey}`)) {
          notifyUpcomingDeadline(task);
          notifiedTasksRef.current.add(`upcoming-${taskKey}`);
        }
      }
    });
  }, [tasks, user, notifyOverdueTask, notifyUpcomingDeadline]);

  // Запускаем периодическую проверку
  useEffect(() => {
    if (!user) return;

    // Проверяем сразу при загрузке
    checkTasks();

    // Устанавливаем интервал проверки каждые 5 минут
    checkIntervalRef.current = setInterval(checkTasks, 5 * 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, checkTasks]);

  // Очищаем кэш уведомлений при смене пользователя
  useEffect(() => {
    notifiedTasksRef.current.clear();
  }, [user?.id]);

  return {
    checkTasks,
  };
}
