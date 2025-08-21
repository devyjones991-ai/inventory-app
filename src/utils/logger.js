/* globals process */

const levels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
}

function getEnvLevel() {
  const level =
    import.meta.env?.VITE_LOG_LEVEL ||
    process?.env?.LOG_LEVEL ||
    process?.env?.VITE_LOG_LEVEL
  return level || 'info'
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
