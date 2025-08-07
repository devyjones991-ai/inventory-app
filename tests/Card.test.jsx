import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Card from "@/components/Card.jsx";

describe("Card", () => {
  it("renders content and applies extra class", () => {
    const { getByText, container } = render(
      <Card className="extra">
        <span>контент</span>
      </Card>,
    );

    expect(getByText("контент")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("extra");
  });
});
