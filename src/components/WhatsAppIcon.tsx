import React from "react";

interface WhatsAppIconProps {
  className?: string;
}

export default function WhatsAppIcon({ className = "w-5 h-5" }: WhatsAppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        d="M17 7H7c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h4l2.5 2.5L15 16h2c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"
        fill="#fff"
      />
      <path
        d="M11 10.5l1 1-1 1"
        stroke="#25D366"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
