const levels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
}

let forcedLevel

export function setLogLevel(level) {
  forcedLevel = level
}

function getEnvLevel() {
  if (forcedLevel) return forcedLevel.toLowerCase()
  const level = import.meta.env?.VITE_LOG_LEVEL
  return (level || 'info').toLowerCase()
}

function shouldLog(level) {
  const envLevel = levels[getEnvLevel()] ?? levels.info
  return envLevel >= levels[level]
}

const logger = {
  info: (...args) => {
    if (shouldLog('info')) console.info(...args)
  },
  warn: (...args) => {
    if (shouldLog('warn')) console.warn(...args)
  },
  error: (...args) => {
    if (shouldLog('error')) console.error(...args)
  },
}

export default logger
