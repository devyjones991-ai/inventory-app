import React from "react";
import { cn } from "../lib/utils";

interface FormErrorProps {
  id?: string;
  message?: string;
  hint?: string;
  className?: string;
}

export default function FormError({ 
  id, 
  message, 
  hint, 
  className 
}: FormErrorProps) {
  if (!message && !hint) return null;
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn("mt-1 text-sm text-destructive", className)}
    >
      {message}
      {hint && (
        <span className="ml-1 text-xs text-muted-foreground">{hint}</span>
      )}
    </p>
  );
}
