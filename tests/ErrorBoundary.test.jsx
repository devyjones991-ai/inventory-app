// @ts-check
import { render, screen } from "@testing-library/react";
import React from "react";

import ErrorBoundary from "@/components/ErrorBoundary";
import logger from "@/utils/logger";

function ProblemComponent() {
  throw new Error("Test error");
}

describe("ErrorBoundary", () => {
  it("перехватывает ошибки и отображает резервный UI", () => {
    const spy = jest.spyOn(logger, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Произошла ошибка.")).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
