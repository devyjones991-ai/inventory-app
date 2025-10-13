import { render, screen } from "@testing-library/react";
import Spinner from "../Spinner";

describe("Spinner", () => {
  test("renders hamster spinner by default", () => {
    render(<Spinner />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();

    // Check if hamster spinner is rendered
    const hamsterSpinner = document.querySelector(".wheel-and-hamster");
    expect(hamsterSpinner).toBeInTheDocument();
  });

  test("renders hamster spinner when variant is hamster", () => {
    render(<Spinner variant="hamster" />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();

    // Check if hamster spinner is rendered
    const hamsterSpinner = document.querySelector(".wheel-and-hamster");
    expect(hamsterSpinner).toBeInTheDocument();
  });

  test("renders default spinner when variant is default", () => {
    render(<Spinner variant="default" />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();

    // Check if default SVG spinner is rendered
    const svgSpinner = document.querySelector("svg");
    expect(svgSpinner).toBeInTheDocument();
    expect(svgSpinner).toHaveClass("animate-spin");
  });

  test("shows loading text with hamster spinner", () => {
    render(<Spinner />);

    const loadingText = screen.getByText("Загрузка...");
    expect(loadingText).toBeInTheDocument();
  });
});
