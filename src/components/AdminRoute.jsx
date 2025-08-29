import React from 'react'
import PropTypes from 'prop-types'

export default function AdminRoute({ children }) {
  return children
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
}
