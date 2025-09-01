const levels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
} as const;

type Level = keyof typeof levels;

let forcedLevel: Level | undefined;

export function setLogLevel(level: Level | undefined): void {
  forcedLevel = level;
}

function getEnvLevel(): Level {
  if (forcedLevel) return forcedLevel.toLowerCase() as Level;
  const level = import.meta.env?.VITE_LOG_LEVEL;
  if (level) return String(level).toLowerCase() as Level;
  const mode = (import.meta.env && import.meta.env.MODE) || "development";
  return (mode === "production" ? "warn" : "info") as Level;
}

function shouldLog(level: Level): boolean {
  const envLevel = levels[getEnvLevel()] ?? levels.info;
  return envLevel >= levels[level];
}

const logger = {
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error(...args);
  },
};

export default logger;
