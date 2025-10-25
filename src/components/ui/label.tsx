import React from "react";

import { cn } from "../../lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return <label ref={ref} className={cn(className)} {...props} />;
  },
);

Label.displayName = "Label";
