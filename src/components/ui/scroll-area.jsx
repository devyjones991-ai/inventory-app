import React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

const ScrollArea = React.forwardRef(function ScrollArea(
  { className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
})

ScrollArea.displayName = 'ScrollArea'

ScrollArea.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

export { ScrollArea }