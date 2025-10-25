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
  const sizeStyles = {
    small: { fontSize: "10px" },
    medium: { fontSize: "14px" },
    large: { fontSize: "18px" },
    xl: { fontSize: "22px" },
  };

  return (
    <div className={`wheel-and-hamster ${className}`} style={sizeStyles[size]}>
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
