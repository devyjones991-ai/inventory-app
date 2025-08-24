import React from 'react'

export const Textarea = React.forwardRef(function Textarea(
  { className = '', ...props },
  ref,
) {
  return <textarea ref={ref} className={className} {...props} />
})
