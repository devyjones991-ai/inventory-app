import React from 'react'
import { cn } from '@/utils/cn'

export const Label = React.forwardRef(function Label(
  { className, ...props },
  ref,
) {
  return <label ref={ref} className={cn(className)} {...props} />
})
