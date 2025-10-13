import { render } from "@testing-library/react";
import HamsterSpinner from "../HamsterSpinner";

describe("HamsterSpinner", () => {
  test("renders hamster spinner with default size", () => {
    render(<HamsterSpinner />);

    const spinner = document.querySelector(".wheel-and-hamster");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("text-sm"); // medium size default
  });

  test("renders hamster spinner with custom size", () => {
    render(<HamsterSpinner size="large" />);

    const spinner = document.querySelector(".wheel-and-hamster");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("text-base"); // large size
  });

  test("renders hamster spinner with custom className", () => {
    render(<HamsterSpinner className="custom-class" />);

    const spinner = document.querySelector(".wheel-and-hamster");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("custom-class");
  });

  test("renders all hamster parts", () => {
    render(<HamsterSpinner />);

    // Check if wheel and hamster elements are present
    const wheel = document.querySelector(".wheel");
    const hamster = document.querySelector(".hamster");
    const spoke = document.querySelector(".spoke");

    expect(wheel).toBeInTheDocument();
    expect(hamster).toBeInTheDocument();
    expect(spoke).toBeInTheDocument();
  });
});
