import { cva } from "class-variance-authority";
import React from "react";

import { cn } from "../../lib/utils";

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

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning";
}

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export type AlertTitleProps = React.HTMLAttributes<HTMLDivElement>;

function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <div
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export type AlertDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return <div className={cn("text-sm opacity-90", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
