import React, { Suspense, lazy, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { isApiConfigured } from "./apiConfig";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import { isSupabaseConfigured } from "./supabaseClient";

import { t } from "@/i18n";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MissingEnvPage = lazy(() => import("./pages/MissingEnvPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

export default function App() {
  useEffect(() => {
    if (isSupabaseConfigured && !isApiConfigured) {
      toast(t("env.apiUnavailable"), { icon: "!" });
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
      <AuthProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <Toaster position="top-right" />
          <ErrorBoundary>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminPage />
                  </PrivateRoute>
                }
              />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
