export const TASK_STATUSES = ["planned", "in_progress", "done", "canceled"];

// Отображение: человекочитаемый статус (RU) -> внутренний ключ
export const STATUS_MAP = {
  запланировано: "planned",
  "в работе": "in_progress",
  выполнено: "done",
  отменено: "canceled",
};

// Обратное отображение: внутренний ключ -> человекочитаемый статус (RU)
export const REVERSE_STATUS_MAP = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [v, k]),
);
