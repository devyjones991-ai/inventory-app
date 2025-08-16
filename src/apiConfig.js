const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export const isApiConfigured = Boolean(apiBaseUrl)

if (!isApiConfigured) {
  console.error(
    'Не задана переменная окружения VITE_API_BASE_URL. Приложение работает в ограниченном режиме.',
  )
}

export { apiBaseUrl }
