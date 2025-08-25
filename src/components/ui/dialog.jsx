
import React from 'react'
import PropTypes from 'prop-types'
import { cn } from '../../utils/cn'
import * as DialogPrimitive from '@radix-ui/react-dialog'

import React from 'react'

import PropTypes from 'prop-types'
import React from 'react'


import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(function DialogOverlay(
  { className, ...props },
  ref,
) {
  return (

    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />

    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClick}
      {...props}
    >
      <div className="absolute inset-0 bg-black/50" />
      {children}
    </div>

  )
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName



export const DialogContent = React.forwardRef(function DialogContent(
  { className, children, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-md bg-base-100 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName
DialogContent.propTypes = {
  className: PropTypes.string,


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

export function DialogHeader({ className, ...props }) {
  return (
    <div

      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  )
}

      className="relative z-50 w-full max-w-md rounded-md bg-base-100 p-4 shadow-lg"
      onClick={(e) => e.stopPropagation()}

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
  className: PropTypes.string,
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


export const DialogTitle = React.forwardRef(function DialogTitle(
  { className, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

DialogTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
}


export function DialogFooter({ children, className, ...props }) {
  return (
    <div className={cn('mt-4 flex space-x-2', className)} {...props}>
      {children}
    </div>

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className,
      )}
      {...props}
    />

  )

export function DialogFooter({ children }) {
  return <div className="mt-4 flex space-x-2">{children}</div>

}
DialogFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
}

export default Dialog
