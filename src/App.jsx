import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster, toast } from "react-hot-toast";
import { isSupabaseConfigured } from "./supabaseClient";
import { isApiConfigured } from "./apiConfig";
import PrivateRoute from "./components/PrivateRoute";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MissingEnvPage = lazy(() => import("./pages/MissingEnvPage"));

export default function App() {
  useEffect(() => {
    if (isSupabaseConfigured && !isApiConfigured) {
      toast("API не настроен. Некоторые функции будут недоступны.", {
        icon: "⚠️",
      });
    }
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <MissingEnvPage />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Toaster position="top-right" />
        <ErrorBoundary>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}
