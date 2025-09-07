// @ts-check
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";

import ObjectList from "@/components/ObjectList";

describe("ObjectList", () => {
  test("рендерит пустое состояние", () => {
    render(<ObjectList objects={[]} onItemClick={() => {}} />);
    expect(screen.getByText("Нет объектов")).toBeInTheDocument();
  });

  test("рендерит элементы списка", () => {
    const objects = [
      { id: 1, name: "Объект 1" },
      { id: 2, name: "Объект 2" },
    ];
    render(<ObjectList objects={objects} onItemClick={() => {}} />);
    expect(screen.getByText("Объект 1")).toBeInTheDocument();
    expect(screen.getByText("Объект 2")).toBeInTheDocument();
  });

  test("клик по элементу вызывает обработчик", () => {
    const objects = [{ id: 1, name: "Объект 1" }];
    const handleClick = vi.fn();
    render(<ObjectList objects={objects} onItemClick={handleClick} />);
    fireEvent.click(screen.getByText("Объект 1"));
    expect(handleClick).toHaveBeenCalledWith(objects[0]);
  });

  test("фильтр по строке поиска", () => {
    const objects = [
      { id: 1, name: "Кошка" },
      { id: 2, name: "Собака" },
    ];
    render(<ObjectList objects={objects} onItemClick={() => {}} />);
    const input = screen.getByPlaceholderText("Поиск");
    fireEvent.change(input, { target: { value: "Соб" } });
    expect(screen.queryByText("Кошка")).not.toBeInTheDocument();
    expect(screen.getByText("Собака")).toBeInTheDocument();
  });

  test("показывает спиннер при загрузке", () => {
    render(<ObjectList loading onItemClick={() => {}} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  test("показывает ошибку", () => {
    const error = new Error("Ошибка загрузки");
    render(<ObjectList error={error} onItemClick={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Ошибка загрузки");
  });
});
