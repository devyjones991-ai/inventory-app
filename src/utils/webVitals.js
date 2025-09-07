import { onCLS, onFID, onLCP } from "web-vitals";

/**
 * Инициализирует сбор показателей веб-виталов и передает их
 * в переданный обработчик или выводит в консоль по умолчанию.
 * @param {(metric: import("web-vitals").Metric) => void} [reporter]
 */
export const initWebVitals = (reporter = console.log) => {
  onCLS(reporter);
  onFID(reporter);
  onLCP(reporter);
};
