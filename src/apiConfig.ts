import { VITE_API_BASE_URL } from "./env";

const apiBaseUrl: string = VITE_API_BASE_URL;

export { apiBaseUrl };

export const isApiConfigured = Boolean(apiBaseUrl);
