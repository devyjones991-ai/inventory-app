import React from "react";

interface ErrorMessageProps {
  error?: string | Error | null;
  message?: string;
}

export default function ErrorMessage({
  error,
  message = "Произошла ошибка",
}: ErrorMessageProps) {
  const text = typeof error === "string" ? error : error?.message || message;
  return (
    <div className="text-center text-destructive p-4" role="alert">
      {text}
    </div>
  );
}
