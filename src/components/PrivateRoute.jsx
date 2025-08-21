import React from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from './Spinner'

export default function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return <Spinner />
  }
  return user ? children : <Navigate to="/auth" replace />
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
}
