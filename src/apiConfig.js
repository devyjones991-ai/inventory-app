const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export const isApiConfigured = Boolean(apiBaseUrl)

export { apiBaseUrl }
