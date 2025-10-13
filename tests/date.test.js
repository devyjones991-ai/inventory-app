// @ts-check
import { describe, it, expect } from "vitest";

import { formatDate, formatDateTime } from "@/utils/date";

describe("date utils", () => {
  it("formatDate форматирует дату", () => {
    const res = formatDate("2020-01-02T00:00:00Z", "ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
    expect(res).toBe("02.01.2020");
  });

  it("formatDateTime форматирует строку", () => {
    const res = formatDateTime("2020-01-02T03:04:05Z", "ru-RU");
    expect(res).toMatch(/02\.01\.2020/);
    // Время может отличаться из-за часового пояса, проверяем только что время присутствует
    expect(res).toMatch(/\d{2}:\d{2}/);
  });

  it("formatDate принимает объект Date и опции по умолчанию", () => {
    const d = new Date(Date.UTC(2020, 0, 2));
    // без передачи options используется формат по умолчанию
    expect(formatDate(d, "ru-RU")).toBe("02.01.2020");
  });

  it("возвращает пустую строку для пустых значений", () => {
    expect(formatDate(undefined)).toBe("");
    expect(formatDateTime(null)).toBe("");
  });
});
