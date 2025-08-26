import React from 'react'
import { cn } from '@/utils/cn'

export const Input = React.forwardRef(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(className)} {...props} />
})
