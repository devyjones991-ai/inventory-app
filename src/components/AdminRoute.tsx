import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import Spinner from "./Spinner";

interface AdminRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function AdminRoute({
  children,
  adminOnly = false,
}: AdminRouteProps) {
  const { user, role, isLoading } = useAuth?.() || {};

  // Backward-compatible: if adminOnly is not requested, just render children
  if (!adminOnly) return <>{children}</>;

  if (isLoading) {
    return <Spinner />;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
