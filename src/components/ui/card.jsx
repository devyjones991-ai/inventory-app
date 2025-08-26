import React, { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

const Card = forwardRef(function Card({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

const CardHeader = forwardRef(function CardHeader(
  { className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
})

const CardTitle = forwardRef(function CardTitle(
  { className, children, ...props },
  ref,
) {
  return (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  )
})

const CardContent = forwardRef(function CardContent(
  { className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
})

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
