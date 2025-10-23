export const TASK_STATUSES = [
  { value: "pending", label: "Ожидает" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Завершено" },
  { value: "cancelled", label: "Отменено" },
];

export const PURCHASE_STATUSES = ["not_paid", "paid"];

export const INSTALL_STATUSES = ["not_installed", "installed"];

export const HARDWARE_FIELDS = {
  NAME: "name",
  LOCATION: "location",
  PURCHASE_STATUS: "purchase_status",
  INSTALL_STATUS: "install_status",
};
