import React from 'react'


export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={() => onOpenChange && onOpenChange(false)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { onOpenChange })
          : child,
      )}

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
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClick}
      {...props}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {children}

    </div>
  )
}


export function DialogContent({ children, className = '' }) {
  const stop = (e) => e.stopPropagation()
  return (
    <div
      className={`relative w-full max-w-md p-4 max-h-screen overflow-y-auto bg-base-100 rounded shadow ${className}`}
      onClick={stop}

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func,
  children: PropTypes.node,
}

export function DialogContent({ children, ...props }) {
  return (
    <div 
      className="relative z-50 w-full max-w-md rounded-md bg-base-100 p-4 shadow-lg"
      onClick={(e) => e.stopPropagation()}
      {...props}

    >
      {children}
    </div>
  )
}


export function DialogHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = '' }) {
  return <h3 className={`font-bold text-lg ${className}`}>{children}</h3>
}

export function DialogFooter({ children, className = '' }) {
  return <div className={`mt-4 flex space-x-2 ${className}`}>{children}</div>
}

export default Dialog

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

