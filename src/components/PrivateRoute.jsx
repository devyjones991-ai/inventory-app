import PropTypes from "prop-types";
import React from "react";
import { Navigate } from "react-router-dom";

import Spinner from "./Spinner";

import { useAuth } from "@/hooks/useAuth";

export default function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
