import React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

export const Label = React.forwardRef(function Label(
  { className, ...props },
  ref,
) {
  return <label ref={ref} className={cn(className)} {...props} />
})

Label.displayName = 'Label'

Label.propTypes = {
  className: PropTypes.string,
  htmlFor: PropTypes.string,
  children: PropTypes.node,
}
