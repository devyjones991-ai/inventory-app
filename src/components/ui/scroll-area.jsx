import PropTypes from 'prop-types'
import { forwardRef } from 'react'

const ScrollArea = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
))

ScrollArea.displayName = 'ScrollArea'

ScrollArea.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

export { ScrollArea }
