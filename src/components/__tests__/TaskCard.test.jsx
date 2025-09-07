/* eslint-env vitest */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
const jest = vi;

import TaskCard from "@/components/TaskCard.jsx";

const task = {
  id: "t1",
  title: "Тестовая задача",
  status: "planned",
};

describe("TaskCard", () => {
  test("не показывает кнопки без прав", () => {
    render(
      <TaskCard
        item={task}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onView={jest.fn()}
        canManage={false}
      />,
    );

    expect(screen.queryByLabelText("Редактировать")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Удалить")).not.toBeInTheDocument();
  });

  test("показывает кнопки при наличии прав", () => {
    render(
      <TaskCard
        item={task}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onView={jest.fn()}
        canManage
      />,
    );

    expect(screen.getByLabelText("Редактировать")).toBeInTheDocument();
    expect(screen.getByLabelText("Удалить")).toBeInTheDocument();
  });
});
