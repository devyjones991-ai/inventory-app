const isProd = globalThis.process?.env?.NODE_ENV === "production";

async function send(level, args) {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, args }),
    });
  } catch {
    // ignore logging errors
  }
}

const levels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
};

let forcedLevel;

export function setLogLevel(level) {
  forcedLevel = level;
}

function getEnvLevel() {
  if (forcedLevel) return forcedLevel.toLowerCase();
  const level = import.meta.env?.VITE_LOG_LEVEL;
  if (level) return String(level).toLowerCase();
  const mode = (import.meta.env && import.meta.env.MODE) || "development";
  return mode === "production" ? "warn" : "info";
}

function shouldLog(level) {
  const envLevel = levels[getEnvLevel()] ?? levels.info;
  return envLevel >= levels[level];
}

function log(level, args) {
  if (isProd) {
    void send(level, args);
  } else {
    console[level](...args);
  }
}

const logger = {
  info: (...args) => {
    if (shouldLog("info")) log("info", args);
  },
  warn: (...args) => {
    if (shouldLog("warn")) log("warn", args);
  },
  error: (...args) => {
    if (shouldLog("error")) log("error", args);
  },
};

export default logger;
