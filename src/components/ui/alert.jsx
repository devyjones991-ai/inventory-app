import { cva } from "class-variance-authority";
import PropTypes from "prop-types";
import React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-md border p-4 text-sm", {
  variants: {
    variant: {
      default: "bg-background text-foreground border-border",
      destructive: "bg-destructive/10 text-destructive border-destructive/30",
      warning:
        "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Alert({ className, variant, ...props }) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }) {
  return (
    <div
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }) {
  return <div className={cn("text-sm opacity-90", className)} {...props} />;
}

Alert.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "destructive", "warning"]),
};

AlertTitle.propTypes = { className: PropTypes.string };
AlertDescription.propTypes = { className: PropTypes.string };

export { Alert, AlertTitle, AlertDescription };
