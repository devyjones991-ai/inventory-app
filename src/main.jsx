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

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Что-то пошло не так.</p>}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);

initWebVitals();
