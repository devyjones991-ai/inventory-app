import React from 'react'
import PropTypes from 'prop-types'

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onOpenChange?.(false)
    }
  }
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  )
}

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  children: PropTypes.node,
}

export function DialogContent({ children }) {
  return (
    <div
      className="relative z-50 w-full max-w-md rounded-md bg-base-100 p-4 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

DialogContent.propTypes = {
  children: PropTypes.node,
}

export function DialogHeader({ children }) {
  return <div className="mb-4">{children}</div>
}

DialogHeader.propTypes = {
  children: PropTypes.node,
}

export function DialogTitle({ children }) {
  return <h3 className="font-bold text-lg">{children}</h3>
}

DialogTitle.propTypes = {
  children: PropTypes.node,
}

export function DialogFooter({ children }) {
  return <div className="mt-4 flex justify-end space-x-2">{children}</div>
}

DialogFooter.propTypes = {
  children: PropTypes.node,
}