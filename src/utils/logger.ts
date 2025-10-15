const isProd = globalThis.process?.env?.NODE_ENV === "production";

type LogLevel = "none" | "error" | "warn" | "info";

// Check if API is available for logging
let apiAvailable: boolean | null = null;
async function checkApiAvailability(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const response = await fetch("/api/logs", {
      method: "HEAD",
      signal: AbortSignal.timeout(1000), // 1 second timeout
    });
    apiAvailable = response.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

async function send(level: LogLevel, args: unknown[]): Promise<void> {
  try {
    const isApiReady = await checkApiAvailability();
    if (!isApiReady) {
      // Fallback to console if API is not available
      (console as Record<string, unknown>)[level](...args);
      return;
    }

    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, args }),
    });
  } catch {
    // Fallback to console on error
    (console as Record<string, unknown>)[level](...args);
  }
}

const levels: Record<LogLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
};

let forcedLevel: string | undefined;

export function setLogLevel(level: string): void {
  forcedLevel = level;
}

function getEnvLevel(): string {
  if (forcedLevel) return forcedLevel.toLowerCase();
  const level = import.meta.env?.VITE_LOG_LEVEL;
  if (level) return String(level).toLowerCase();
  const mode = (import.meta.env && import.meta.env.MODE) || "development";
  return mode === "production" ? "warn" : "info";
}

function shouldLog(level: LogLevel): boolean {
  const envLevel = levels[getEnvLevel() as LogLevel] ?? levels.info;
  return envLevel >= levels[level];
}

function log(level: LogLevel, args: unknown[]): void {
  if (isProd) {
    void send(level, args);
  } else {
    (console as Record<string, unknown>)[level](...args);
  }
}

const logger = {
  info: (...args: unknown[]) => {
    if (shouldLog("info")) log("info", args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) log("warn", args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) log("error", args);
  },
};

export default logger;
