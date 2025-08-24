import React from 'react'
import PropTypes from 'prop-types'

function Dialog({ open, onOpenChange, children, ...props }) {
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
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { onOpenChange })
          : child,
      )}
    </div>
  )
}

function DialogContent({ children, className = '', ...props }) {
  return (
    <div
      className={`relative z-50 w-full max-w-md rounded-md bg-base-100 p-4 shadow-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

function DialogTitle({ children, className = '' }) {
  return <h3 className={`font-bold text-lg ${className}`}>{children}</h3>
}

function DialogFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-4 flex space-x-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func,
  children: PropTypes.node,
}

DialogContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

DialogHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

DialogTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

DialogFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
