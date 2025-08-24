import React, { forwardRef } from 'react'
import PropTypes from 'prop-types'

const Card = forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
))

const CardHeader = forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`p-4 ${className}`}
    {...props}
  >
    {children}
  </div>
))

const CardTitle = forwardRef(({ className = '', children, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold ${className}`}
    {...props}
  >
    {children}
  </h3>
))

const CardContent = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  ),
)

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardContent.displayName = 'CardContent'

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

CardTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

export { Card, CardHeader, CardTitle, CardContent }