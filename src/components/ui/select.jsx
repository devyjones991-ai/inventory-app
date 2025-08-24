import React from 'react'

export function Select({ value, onValueChange, children }) {
  const items = []
  let triggerProps = {}
  React.Children.forEach(children, (child) => {
    if (child.type === SelectTrigger) {
      triggerProps = child.props || {}
    }
    if (child.type === SelectContent) {
      React.Children.forEach(child.props.children, (item) => {
        if (item.type === SelectItem) {
          items.push(item)
        }
      })
    }
  })
  return (
    <select
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
      className={triggerProps.className}
    >
      {triggerProps.children &&
        React.Children.map(triggerProps.children, (child) =>
          child.type === SelectValue && child.props.placeholder ? (
            <option value="" disabled>
              {child.props.placeholder}
            </option>
          ) : null,
        )}
      {items.map((item, index) => (
        <option key={index} value={item.props.value}>
          {item.props.children}
        </option>
      ))}
    </select>
  )
}

export const SelectTrigger = ({ children, className }) => <>{children}</> // eslint-disable-line no-unused-vars
export const SelectContent = ({ children }) => <>{children}</>
export const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
)
export const SelectValue = ({ placeholder }) => null // eslint-disable-line no-unused-vars
