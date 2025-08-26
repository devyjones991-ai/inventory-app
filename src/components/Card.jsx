import React from 'react'
import PropTypes from 'prop-types'

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl shadow-md p-4 bg-card text-card-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}
