import React from "react";
import PropTypes from "prop-types";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground border-transparent",
        secondary: "bg-accent text-accent-foreground border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground border-transparent",
        outline: "text-foreground",
        success: "bg-green-500 text-white border-transparent dark:bg-green-600",
        warning:
          "bg-yellow-400 text-black border-transparent dark:bg-yellow-500",
        info: "bg-blue-500 text-white border-transparent dark:bg-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

Badge.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    "default",
    "secondary",
    "destructive",
    "outline",
    "success",
    "warning",
    "info",
  ]),
};

export { Badge };
