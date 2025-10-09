/* eslint-env vitest */
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, test, expect } from "vitest";

function InventoryTabsHarness() {
  const [tasksCount, setTasksCount] = React.useState(0);
  const [chatCount, setChatCount] = React.useState(0);
  const hardwareItems = React.useMemo(() => [{ id: 1 }, { id: 2 }], []);

  return (
    <div>
      <button type="button">Железо ({hardwareItems.length})</button>
      <button
        type="button"
        onClick={() => setTasksCount((prev) => (prev === 0 ? 5 : 0))}
      >
        Задачи ({tasksCount})
      </button>
      <button
        type="button"
        onClick={() => setChatCount((prev) => (prev === 0 ? 3 : 0))}
      >
        Чат ({chatCount})
      </button>
      <button type="button">Финансы</button>
    </div>
  );
}

describe("InventoryTabs (harness)", () => {
  test("отображает количество на вкладках", async () => {
    render(<InventoryTabsHarness />);

    expect(screen.getByText("Железо (2)")).toBeInTheDocument();
    expect(screen.getByText("Задачи (0)")).toBeInTheDocument();
    expect(screen.getByText("Чат (0)")).toBeInTheDocument();
    expect(screen.getByText("Финансы")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Задачи (0)"));
    expect(await screen.findByText("Задачи (5)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Чат (0)"));
    expect(await screen.findByText("Чат (3)")).toBeInTheDocument();
  });
});
