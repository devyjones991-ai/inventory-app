
import React from 'react'
import PropTypes from 'prop-types'

const baseClasses =
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

const variants = {
  default: 'bg-primary text-primary-content hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-content hover:bg-secondary/90',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
  link: 'underline-offset-4 hover:underline text-primary',
  destructive: 'bg-error text-error-content hover:bg-error/90',
}

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-8',
  icon: 'h-10 w-10',
}

const Button = React.forwardRef(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = [
      baseClasses,
      variants[variant] || variants.default,
      sizes[size] || sizes.default,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: [classes, children.props.className]
          .filter(Boolean)
          .join(' '),
        ref,
        ...props,
      })
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.string,
  asChild: PropTypes.bool,
  children: PropTypes.node,
}

export { Button }

import PropTypes from 'prop-types'

export function Button({
  size = 'default',
  variant = 'primary',
  className = '',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  const variantClass = variant ? `btn-${variant}` : ''
  const combined = ['btn', sizeClass, variantClass, className]
    .filter(Boolean)
    .join(' ')
  return <button className={combined} {...props} />
}

Button.propTypes = {
  size: PropTypes.oneOf(['sm', 'lg', 'default']),
  variant: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
}

