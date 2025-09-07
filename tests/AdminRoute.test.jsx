import { render, screen } from "@testing-library/react";
import React from "react";

import AdminRoute from "@/components/AdminRoute.jsx";

describe("AdminRoute", () => {
  it("рендерит дочерние элементы без проверки роли", () => {
    render(
      <AdminRoute>
        <div>Секрет</div>
      </AdminRoute>,
    );

    expect(screen.getByText("Секрет")).toBeInTheDocument();
  });
});
