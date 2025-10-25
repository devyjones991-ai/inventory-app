/* eslint-disable react-refresh/only-export-components */
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import React from "react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-transparent transition-colors transition-shadow duration-150 md:hover:shadow-sm md:hover:ring-1 md:hover:ring-ring md:hover:ring-offset-1",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground md:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground md:hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground md:hover:bg-destructive/90",
        success:
          "bg-green-600 text-white md:hover:bg-green-700 dark:bg-green-500 dark:md:hover:bg-green-600",
        info: "bg-blue-600 text-white md:hover:bg-blue-700 dark:bg-blue-500 dark:md:hover:bg-blue-600",
        warning:
          "bg-amber-400 text-black md:hover:bg-amber-500 dark:bg-amber-300",
        outline:
          "border border-border bg-background md:hover:bg-accent md:hover:text-accent-foreground",
        ghost: "md:hover:bg-accent md:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 md:hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "info"
    | "success"
    | "warning";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
