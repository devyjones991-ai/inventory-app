export function formatDate(value, locale = "ru-RU", options) {
  if (!value) return "";
  try {
    const date =
      typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : value;
    const fmt = options || {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return date.toLocaleDateString(locale, fmt);
  } catch {
    return String(value);
  }
}

export function formatDateTime(value, locale = "ru-RU") {
  if (!value) return "";
  try {
    const date =
      typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : value;
    return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(
      locale,
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    )}`;
  } catch {
    return String(value);
  }
}
