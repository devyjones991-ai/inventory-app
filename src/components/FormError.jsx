import PropTypes from "prop-types";
import React from "react";

import { cn } from "@/lib/utils";

export default function FormError({ id, message, hint, className }) {
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

FormError.propTypes = {
  id: PropTypes.string,
  message: PropTypes.string,
  hint: PropTypes.string,
  className: PropTypes.string,
};
