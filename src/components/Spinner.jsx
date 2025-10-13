import PropTypes from "prop-types";

import HamsterSpinner from "./HamsterSpinner";

export default function Spinner({ variant = "hamster" }) {
  if (variant === "hamster") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div
          className="flex flex-col items-center justify-center p-8"
          data-testid="spinner"
        >
          <HamsterSpinner size="large" />
          <p className="mt-4 text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Fallback to original spinner
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="flex justify-center p-4" data-testid="spinner">
        <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    </div>
  );
}

Spinner.propTypes = {
  variant: PropTypes.oneOf(["hamster", "default"]),
};
