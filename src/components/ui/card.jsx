import React from 'react'
import PropTypes from 'prop-types'

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl shadow-md bg-base-100 transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`p-4 pb-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`text-lg font-bold ${className}`} {...props}>
      {children}
    </h3>
  )
}

CardTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-4 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

export default Card
