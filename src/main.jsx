import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { initWebVitals } from "./utils/webVitals";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Что-то пошло не так.</p>}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);

initWebVitals();

if (
  import.meta.env.MODE !== "test" &&
  typeof window !== "undefined" &&
  "serviceWorker" in navigator
) {
  void import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegistered() {
        console.info("Service worker зарегистрирован");
      },
      onRegisterError(error) {
        console.error("Ошибка регистрации сервис-воркера", error);
      },
    });
  });
}
