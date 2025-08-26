import React from 'react'
import { cn } from '@/utils/cn'

export const Textarea = React.forwardRef(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(className)} {...props} />
})
