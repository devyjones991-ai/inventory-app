import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";

import FormError from "@/components/FormError.jsx";

describe("FormError", () => {
  it("рендерит сообщение и подсказку", () => {
    render(<FormError id="name-error" message="Ошибка" hint="Подсказка" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Ошибка");
    expect(alert).toHaveTextContent("Подсказка");
    expect(alert).toHaveAttribute("id", "name-error");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  it("ничего не рендерит без сообщения и подсказки", () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });
});
