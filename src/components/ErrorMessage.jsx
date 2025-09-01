import React from "react";
import PropTypes from "prop-types";

export default function ErrorMessage({ error, message = "Произошла ошибка" }) {
  const text = typeof error === "string" ? error : error?.message || message;
  return (
    <div className="text-center text-red-500 p-4" role="alert">
      {text}
    </div>
  );
}

ErrorMessage.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ message: PropTypes.string }),
  ]),
  message: PropTypes.string,
};
