import React from 'react'

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl shadow-md p-4 bg-base-100 transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
