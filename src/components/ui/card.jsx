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

const CardHeader = forwardRef(function CardHeader({ className, children, ...props }, ref) {
  return (
    <div ref={ref} className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
})

const CardTitle = forwardRef(function CardTitle({ className, children, ...props }, ref) {
  return (
    <h3 ref={ref} className={cn('text-lg font-semibold', className)} {...props}>
      {children}
    </h3>
  )
})

const CardContent = forwardRef(function CardContent({ className, children, ...props }, ref) {
  return (
    <div ref={ref} className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
})

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }