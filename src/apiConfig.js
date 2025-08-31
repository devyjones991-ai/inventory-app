/* global process */
import logger from "./utils/logger";

const apiBaseUrl =
  import.meta.env?.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL;

export const isApiConfigured = Boolean(apiBaseUrl);

if (!isApiConfigured) {
  logger.error(
    "VITE_API_BASE_URL is not set. Application runs in limited mode.",
  );
}

export { apiBaseUrl };
