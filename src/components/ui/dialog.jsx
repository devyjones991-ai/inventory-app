import React from 'react'
import PropTypes from 'prop-types'

export function Dialog({ open, onOpenChange, children, ...props }) {
  if (!open) return null
  const handleClick = (e) => {
    if (e.target === e.currentTarget && onOpenChange) {
      onOpenChange(false)
    }
  }
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}
Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func,
  children: PropTypes.node,
}

export function DialogContent({ children, ...props }) {
  return (
    <div className="relative" {...props}>
      {children}
    </div>
  )
}
DialogContent.propTypes = {
  children: PropTypes.node,
}

export function DialogFooter({ children, ...props }) {
  return (
    <div className="mt-2 text-right" {...props}>
      {children}
    </div>
  )
}
DialogFooter.propTypes = {
  children: PropTypes.node,
}

export default Dialog
