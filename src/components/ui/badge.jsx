import React from 'react'
import PropTypes from 'prop-types'
import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-transparent',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        info: 'bg-sky-500 text-white border-transparent',
        warning: 'bg-yellow-500 text-yellow-900 border-transparent',
        success: 'bg-green-500 text-white border-transparent',
        destructive:
          'bg-destructive text-destructive-foreground border-transparent',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const Badge = ({ className, variant, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

Badge.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    'default',
    'secondary',
    'info',
    'warning',
    'success',
    'destructive',
    'outline',
  ]),
}
