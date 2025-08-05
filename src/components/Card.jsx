import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`rounded-2xl shadow-md p-4 bg-white ${className}`} {...props}>
      {children}
    </div>
  );
}
