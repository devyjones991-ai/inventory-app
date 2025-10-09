import "frappe-gantt/dist/frappe-gantt.css";

import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { TASK_STATUSES } from "@/constants";
import logger from "@/utils/logger";

const STATUS_PROGRESS = {
  planned: 15,
  in_progress: 55,
  done: 100,
  completed: 100,
  cancelled: 0,
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (DATE_REGEX.test(trimmed)) return trimmed;
    if (trimmed.length >= 10 && DATE_REGEX.test(trimmed.slice(0, 10))) {
      return trimmed.slice(0, 10);
    }
  }
  return null;
};

const mapDependencies = (deps) => {
  if (!deps) return "";
  const list = Array.isArray(deps)
    ? deps
    : typeof deps === "string"
      ? deps.split(",")
      : [];
  return Array.from(
    new Set(
      list
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  ).join(",");
};

const pickProgress = (status) => {
  if (!status) return 0;
  const normalized = TASK_STATUSES.includes(status) ? status : String(status);
  return STATUS_PROGRESS[normalized] ?? 0;
};

let Gantt = null;

function GanttTab({ tasks = [], onTaskReschedule, selected }) {
  const containerRef = useRef(null);
  const ganttRef = useRef(null);

  const ganttTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks
      .map((task) => {
        const start =
          toDateString(task.start_date) || toDateString(task.due_date);
        const end =
          toDateString(task.end_date) ||
          toDateString(task.due_date) ||
          toDateString(task.start_date);
        if (!start || !end) return null;
        return {
          id: task.id,
          name: task.title || "Без названия",
          start,
          end,
          progress: pickProgress(task.status),
          dependencies: mapDependencies(task.dependency_ids),
          status: task.status,
          dependency_ids: task.dependency_ids,
        };
      })
      .filter(Boolean);
  }, [tasks]);

  const handleDateChange = useCallback(
    (task, start, end) => {
      if (typeof onTaskReschedule !== "function") return;
      try {
        onTaskReschedule(task, start, end);
      } catch (err) {
        logger.error("Ошибка обработки изменения дат диаграммы Ганта:", err);
      }
    },
    [onTaskReschedule],
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;

    const container = containerRef.current;
    const render = async () => {
      if (!container) return;
      if (!Gantt) {
        const module = await import("frappe-gantt");
        Gantt = module.default || module;
      }
      if (!Gantt || cancelled) return;
      container.innerHTML = "";
      if (!ganttTasks.length) {
        ganttRef.current = null;
        return;
      }
      ganttRef.current = new Gantt(container, ganttTasks, {
        language: "ru",
        view_mode: "Day",
        on_date_change: handleDateChange,
        on_progress_change: () => {},
      });
    };

    render();

    return () => {
      cancelled = true;
      if (container) {
        container.innerHTML = "";
      }
      ganttRef.current = null;
    };
  }, [ganttTasks, handleDateChange]);

  if (!selected) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Выберите объект, чтобы просмотреть диаграмму Ганта.
      </div>
    );
  }

  if (!ganttTasks.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Задачи отсутствуют или не содержат дат для диаграммы Ганта.
      </div>
    );
  }

  return <div ref={containerRef} className="overflow-auto" />;
}

GanttTab.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.object),
  onTaskReschedule: PropTypes.func,
  selected: PropTypes.object,
};

export default GanttTab;
