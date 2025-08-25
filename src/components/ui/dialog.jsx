import React from 'react'
import PropTypes from 'prop-types'
import { cn } from '../../utils/cn'

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
      <div className="absolute inset-0 bg-black/50" />
      {children}
    </div>
  )
}

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func,
  children: PropTypes.node,
}

export function DialogContent({ children, className, ...props }) {
  const stop = (e) => e.stopPropagation()
  return (
    <div
      className={cn(
        'relative z-50 w-full max-w-md rounded-md bg-base-100 p-4 shadow-lg',
        className,
      )}
      onClick={stop}
      {...props}
    >
      {children}
    </div>
  )
}

DialogContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

export function DialogHeader({ children, className, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

DialogHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

export function DialogTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('font-bold text-lg', className)} {...props}>
      {children}
    </h3>
  )
}

DialogTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

export function DialogFooter({ children, className, ...props }) {
  return (
    <div className={cn('mt-4 flex space-x-2', className)} {...props}>
      {children}
    </div>
  )
}

DialogFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

export default Dialog
