import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import React from "react";

describe("Button", () => {
  it("applies variant styles", () => {
    render(<Button variant="secondary">Click</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-secondary");
  });

  it("applies size styles", () => {
    render(<Button size="lg">Click</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-11", "px-8");
  });

  it("renders child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("bg-primary");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
