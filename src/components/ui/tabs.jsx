import React, { createContext, useContext } from 'react'
import PropTypes from 'prop-types'

const TabsContext = createContext()

function Tabs({ value, onValueChange, children, className = '', ...props }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

Tabs.propTypes = {
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
}

function TabsList({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

TabsList.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

function TabsTrigger({ value, children, className = '', ...props }) {
  const { value: active, onValueChange } = useContext(TabsContext)
  const activeClass = active === value ? 'tab-active' : ''
  return (
    <button
      className={`${className} ${activeClass}`.trim()}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

TabsTrigger.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
}

function TabsContent({ value, children, className = '', ...props }) {
  const { value: active } = useContext(TabsContext)
  if (active !== value) return null
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

TabsContent.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
