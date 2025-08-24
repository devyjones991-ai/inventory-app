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
    </div>
  )
}

export function DialogContent({ children, className = '' }) {
  const stop = (e) => e.stopPropagation()
  return (
    <div
      className={`relative w-full max-w-md p-4 max-h-screen overflow-y-auto bg-base-100 rounded shadow ${className}`}
      onClick={stop}
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
