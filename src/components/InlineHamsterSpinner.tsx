import React from "react";
import "../assets/hamster-spinner.css";

interface InlineHamsterSpinnerProps {
  size?: "xs" | "small" | "medium" | "large";
  className?: string;
}

export default function InlineHamsterSpinner({
  size = "small",
  className = "",
}: InlineHamsterSpinnerProps) {
  const sizeStyles = {
    xs: { fontSize: "8px" },
    small: { fontSize: "12px" },
    medium: { fontSize: "14px" },
    large: { fontSize: "18px" },
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="wheel-and-hamster" style={sizeStyles[size]}>
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
      </div>
    </div>
  );
}
