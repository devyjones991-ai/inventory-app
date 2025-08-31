import React from "react";
import PropTypes from "prop-types";

export default function ErrorMessage({ error, message = "Произошла ошибка" }) {
  const text = error?.message ? `${message}: ${error.message}` : message;
  return (
    <div className="text-center text-red-500 p-4" role="alert">
      {text}
    </div>
  );
}

ErrorMessage.propTypes = {
  error: PropTypes.shape({ message: PropTypes.string }),
  message: PropTypes.string,
};
