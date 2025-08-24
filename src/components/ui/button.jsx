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
