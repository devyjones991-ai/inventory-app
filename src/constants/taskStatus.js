export const TASK_STATUSES = ["planned", "in_progress", "done", "canceled"];

// Подписи статусов (RU) -> машинные значения
export const STATUS_MAP = {
  Запланирована: "planned",
  "В работе": "in_progress",
  Выполнена: "done",
  Отменена: "canceled",
};

// Обратное отображение: машинные -> подписи (RU)
export const REVERSE_STATUS_MAP = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [v, k]),
);
