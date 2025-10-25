import React from "react";
import "../assets/hamster-spinner.css";

interface HamsterSpinnerProps {
  size?: "small" | "medium" | "large" | "xl";
  className?: string;
}

export default function HamsterSpinner({
  size = "medium",
  className = "",
}: HamsterSpinnerProps) {
  const sizeClasses = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
    xl: "text-lg",
  };

  return (
    <div className={`wheel-and-hamster ${sizeClasses[size]} ${className}`}>
      <div className="wheel">
        <div className="spoke"></div>
      </div>
      <div className="hamster">
        <div className="hamster__head">
          <div className="hamster__ear"></div>
          <div className="hamster__eye"></div>
          <div className="hamster__nose"></div>
        </div>
        <div className="hamster__body">
          <div className="hamster__limb hamster__limb--fr"></div>
          <div className="hamster__limb hamster__limb--fl"></div>
          <div className="hamster__limb hamster__limb--br"></div>
          <div className="hamster__limb hamster__limb--bl"></div>
          <div className="hamster__tail"></div>
        </div>
      </div>
      <div className="spoke"></div>
    </div>
  );
}
