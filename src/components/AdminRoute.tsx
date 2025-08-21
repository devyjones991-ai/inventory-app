// @ts-nocheck
import React from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminRoute({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/auth" replace />
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
}
