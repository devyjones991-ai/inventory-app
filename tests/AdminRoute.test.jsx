import { screen } from "@testing-library/react";
import React from "react";

import AdminRoute from "@/components/AdminRoute.jsx";
import { render } from "./test-utils";

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
