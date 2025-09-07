import PropTypes from "prop-types";
import React from "react";
import { Navigate } from "react-router-dom";

import Spinner from "./Spinner";

import { useAuth } from "@/hooks/useAuth";

export default function AdminRoute({ children, adminOnly = false }) {
  const { user, role, isLoading } = useAuth?.() || {};

  // Backward-compatible: if adminOnly is not requested, just render children
  if (!adminOnly) return children;

  if (isLoading) {
    return <Spinner />;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
};
