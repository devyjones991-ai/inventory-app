const isProd = globalThis.process?.env?.NODE_ENV === "production";

// Check if API is available for logging
let apiAvailable = null;
async function checkApiAvailability() {
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

async function send(level, args) {
  try {
    const isApiReady = await checkApiAvailability();
    if (!isApiReady) {
      // Fallback to console if API is not available
      console[level](...args);
      return;
    }

    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, args }),
    });
  } catch {
    // Fallback to console on error
    console[level](...args);
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
