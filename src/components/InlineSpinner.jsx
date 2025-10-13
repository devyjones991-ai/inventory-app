import PropTypes from "prop-types";
import React from "react";

import InlineHamsterSpinner from "./InlineHamsterSpinner";

export default function InlineSpinner({ size = 20, variant = "hamster" }) {
  if (variant === "hamster") {
    const sizeMap = {
      16: "xs",
      20: "small",
      24: "medium",
      32: "large",
    };

    const hamsterSize = sizeMap[size] || "small";
    return <InlineHamsterSpinner size={hamsterSize} />;
  }

  // Fallback to original spinner
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      className="animate-spin text-primary"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      role="status"
      aria-label="loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      ></path>
    </svg>
  );
}

InlineSpinner.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  variant: PropTypes.oneOf(["hamster", "default"]),
};
