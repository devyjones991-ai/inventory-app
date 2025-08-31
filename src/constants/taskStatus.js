export const TASK_STATUSES = ["planned", "in_progress", "done", "canceled"];

// RU label -> internal code
export const STATUS_MAP = {
  Запланирована: "planned",
  "В работе": "in_progress",
  Выполнена: "done",
  Отменена: "canceled",
};

// internal code -> RU label
export const REVERSE_STATUS_MAP = {
  planned: "Запланирована",
  in_progress: "В работе",
  done: "Выполнена",
  canceled: "Отменена",
};
