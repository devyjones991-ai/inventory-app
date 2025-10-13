import PropTypes from "prop-types";
import React from "react";
import "../assets/hamster-spinner.css";

export default function InlineHamsterSpinner({
  size = "small",
  className = "",
}) {
  const sizeClasses = {
    xs: "text-xs",
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`wheel-and-hamster ${sizeClasses[size]}`}>
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

InlineHamsterSpinner.propTypes = {
  size: PropTypes.oneOf(["xs", "small", "medium", "large"]),
  className: PropTypes.string,
};
